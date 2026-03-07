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

    // The Pi payment API always uses api.minepi.com — the testnet only
    // determines which coin ledger is used, not the API host.
    const piResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${piApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!piResponse.ok) {
      const errorData = await piResponse.text();
      return NextResponse.json(
        { success: false, error: `Pi Network returned ${piResponse.status}`, detail: errorData },
        { status: 200, headers: CORS }
      );
    }

    const piData = await piResponse.json();

    // Persist approved payment record to Upstash KV
    await redis.set(
      `payment:${paymentId}`,
      JSON.stringify({
        paymentId,
        status: "approved",
        approvedAt: new Date().toISOString(),
        piData,
      }),
      { ex: 60 * 60 * 24 * 30 } // 30-day TTL
    );

    return NextResponse.json(
      { success: true, paymentId, status: "approved" },
      { headers: CORS }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Approval failed", detail: String(error) },
      { status: 500, headers: CORS }
    );
  }
}
