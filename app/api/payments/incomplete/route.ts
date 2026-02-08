import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID required" },
        { status: 400 }
      );
    }

    const piApiKey = process.env.PI_API_KEY;
    
    if (!piApiKey) {
      console.error("[v0] PI_API_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get incomplete payment details from Pi Network
    const incompleteResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/incomplete`,
      {
        method: "GET",
        headers: {
          Authorization: `Key ${piApiKey}`,
        },
      }
    );

    if (!incompleteResponse.ok) {
      const errorData = await incompleteResponse.json();
      console.error("[v0] Pi payment incomplete check failed:", errorData);
      return NextResponse.json(
        { error: "Payment incomplete check failed", details: errorData },
        { status: incompleteResponse.status }
      );
    }

    const incompleteData = await incompleteResponse.json();

    return NextResponse.json({
      success: true,
      paymentId,
      ...incompleteData,
    });
  } catch (error) {
    console.error("[v0] Payment incomplete check error:", error);
    return NextResponse.json(
      { error: "Payment incomplete check failed" },
      { status: 500 }
    );
  }
}
