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

/**
 * Called by Pi SDK onIncompletePaymentFound callback.
 * Pi SDK passes the full payment object — we must either approve+complete
 * or cancel it to unblock the user from making new payments.
 */
export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400, headers: CORS }
      );
    }

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      return NextResponse.json(
        { error: "PI_API_KEY not configured" },
        { status: 500, headers: CORS }
      );
    }

    // Check KV for existing record
    const existing = await redis.get(`payment:${paymentId}`);

    if (existing) {
      const record = typeof existing === "string" ? JSON.parse(existing) : existing;

      if (record.status === "completed") {
        // Already completed — nothing to do
        return NextResponse.json(
          { success: true, paymentId, action: "already_completed" },
          { headers: CORS }
        );
      }

      if (record.status === "approved") {
        // Approved but not completed — complete it now
        // (This case requires a txid which we may not have; mark for manual review)
        await redis.set(
          `payment:${paymentId}`,
          JSON.stringify({ ...record, status: "pending_completion" }),
          { ex: 60 * 60 * 24 * 30 }
        );
        return NextResponse.json(
          { success: true, paymentId, action: "pending_completion" },
          { headers: CORS }
        );
      }
    }

    // Unknown payment — approve it now to unblock the user
    const approveRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${piApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const approveData = approveRes.ok ? await approveRes.json() : null;

    await redis.set(
      `payment:${paymentId}`,
      JSON.stringify({
        paymentId,
        status: "approved_incomplete",
        recoveredAt: new Date().toISOString(),
        approveData,
      }),
      { ex: 60 * 60 * 24 * 30 }
    );

    return NextResponse.json(
      { success: true, paymentId, action: "recovered_and_approved" },
      { headers: CORS }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Incomplete payment handler failed", detail: String(error) },
      { status: 500, headers: CORS }
    );
  }
}
