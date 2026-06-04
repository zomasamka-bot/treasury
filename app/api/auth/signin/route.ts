import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { authToken } = await request.json();

    if (!authToken) {
      return NextResponse.json(
        { error: "Authentication token required" },
        { status: 400 }
      );
    }

    // Verify with Pi Network backend
    const piApiKey = process.env.PI_API_KEY;
    
    if (!piApiKey) {
      console.error("[v0] PI_API_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Pi access tokens are always issued by api.minepi.com — the identity
    // infrastructure is mainnet-only regardless of testnet coin usage.
    const verifyResponse = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!verifyResponse.ok) {
      const errBody = await verifyResponse.text();
      console.error("[v0] Pi /v2/me failed:", verifyResponse.status, errBody);
      return NextResponse.json(
        { error: "Invalid authentication token", detail: errBody },
        { status: 401 }
      );
    }

    const userData = await verifyResponse.json();

    return NextResponse.json({
      success: true,
      user: {
        uid: userData.uid,
        username: userData.username,
      },
    });
  } catch (error) {
    console.error("[v0] Auth signin error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
