import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS });
}

export async function POST(request: Request) {
  try {
    console.log("[v0] COMPLETE ENDPOINT: request received");
    
    const body = await request.json();
    console.log("[v0] COMPLETE ENDPOINT: request body:", JSON.stringify(body));
    
    const { paymentId, txid } = body;
    console.log("[v0] COMPLETE ENDPOINT: extracted paymentId:", paymentId, "txid:", txid);

    if (!paymentId || !txid) {
      console.log("[v0] COMPLETE ENDPOINT: paymentId or txid is missing");
      return NextResponse.json(
        { success: false, error: "paymentId and txid are required" },
        { status: 400, headers: CORS }
      );
    }

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      console.error("[v0] COMPLETE ENDPOINT: PI_API_KEY not configured in environment");
      return NextResponse.json(
        { success: false, error: "PI_API_KEY not configured on server" },
        { status: 500, headers: CORS }
      );
    }

    // Log the API key prefix to help identify the app context (never log full key)
    const keyPrefix = piApiKey.substring(0, 8) + "...";
    console.log("[v0] COMPLETE ENDPOINT: using PI_API_KEY:", keyPrefix);

    console.log("[v0] COMPLETE ENDPOINT: completing paymentId:", paymentId, "with txid:", txid);
    const completeUrl = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
    console.log("[v0] COMPLETE ENDPOINT: calling Pi API endpoint:", completeUrl);

    // The Pi payment API always uses api.minepi.com — the testnet only
    // determines which coin ledger is used, not the API host.
    const piResponse = await fetch(completeUrl, {
      method: "POST",
      headers: {
        Authorization: `Key ${piApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txid }),
    });

    console.log("[v0] COMPLETE ENDPOINT: Pi API response status:", piResponse.status);

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      console.error("[v0] COMPLETE ENDPOINT: Pi API error response:", piResponse.status, errorText);
      
      // Parse error to provide better diagnostics
      let parsedError = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson.error || errorJson.detail || errorText;
      } catch {
        // Use raw error text if JSON parsing fails
      }
      
      console.error("[v0] COMPLETE ENDPOINT: DIAGNOSTIC INFO:");
      console.error("[v0]   - This 404 payment_not_found error typically means:");
      console.error("[v0]   - 1. PI_API_KEY belongs to a different app than the one in Pi Browser");
      console.error("[v0]   - 2. The payment was created in one app context, but backend is using a different app's credentials");
      console.error("[v0]   - 3. Verify PI_API_KEY matches the app ID running in Pi Browser");
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Pi Network completion failed (${piResponse.status})`,
          detail: parsedError,
          diagnostic: "Payment not found - check if PI_API_KEY belongs to correct app"
        },
        { status: 200, headers: CORS }
      );
    }

    const piData = await piResponse.json();
    console.log("[v0] COMPLETE ENDPOINT: Pi API completion successful, response:", JSON.stringify(piData).substring(0, 200));

    // Persist completed payment record to Upstash KV
    try {
      await redis.set(
        `payment:${paymentId}`,
        JSON.stringify({
          paymentId,
          txid,
          status: "completed",
          completedAt: new Date().toISOString(),
          piData,
        }),
        { ex: 60 * 60 * 24 * 30 } // 30 day TTL
      );
      console.log("[v0] COMPLETE ENDPOINT: Payment completion record persisted to Redis");

      // Also store by txid for lookup
      await redis.set(
        `tx:${txid}`,
        paymentId,
        { ex: 60 * 60 * 24 * 30 }
      );
    } catch (redisError) {
      console.error("[v0] COMPLETE ENDPOINT: Redis persistence error:", redisError);
      // Don't fail completion if persistence fails, just log it
    }

    console.log("[v0] COMPLETE ENDPOINT: returning success response");
    return NextResponse.json(
      { success: true, paymentId, txid, status: "completed" },
      { headers: CORS }
    );
  } catch (error) {
    console.error("[v0] COMPLETE ENDPOINT: exception caught:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Completion failed", 
        detail: error instanceof Error ? error.message : String(error) 
      },
      { status: 500, headers: CORS }
    );
  }
}
