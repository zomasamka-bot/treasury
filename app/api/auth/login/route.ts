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
    const { pi_auth_token } = await request.json();

    if (!pi_auth_token) {
      return NextResponse.json(
        { error: "pi_auth_token is required" },
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

    // Pi access tokens are always issued by api.minepi.com regardless of
    // whether the app runs on testnet or mainnet. The testnet only affects
    // which coins are spent — the identity/token infrastructure is always
    // on mainnet. Using api.testnet.minepi.com/v2/me returns 404.
    const verifyResponse = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${pi_auth_token}`,
      },
    });

    if (!verifyResponse.ok) {
      const errBody = await verifyResponse.text();
      console.error("[v0] Pi /v2/me failed:", verifyResponse.status, errBody);
      return NextResponse.json(
        { error: "Invalid Pi access token", detail: errBody },
        { status: 401, headers: CORS }
      );
    }

    const piUser = await verifyResponse.json();

    // Persist user session to Upstash KV
    await redis.set(
      `user:${piUser.uid}`,
      JSON.stringify({
        uid: piUser.uid,
        username: piUser.username,
        lastLogin: new Date().toISOString(),
      }),
      { ex: 60 * 60 * 24 * 7 } // 7 day TTL
    );

    return NextResponse.json(
      {
        id: piUser.uid,
        username: piUser.username,
        credits_balance: 0,
        terms_accepted: true,
        app_id: process.env.NEXT_PUBLIC_PI_APP_ID || "treasury-action",
      },
      { headers: CORS }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed", detail: String(error) },
      { status: 500, headers: CORS }
    );
  }
}
