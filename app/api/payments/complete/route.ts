import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "Payment ID and transaction ID required" },
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

    // Complete the payment with Pi Network
    const completeResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${piApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
      }
    );

    if (!completeResponse.ok) {
      const errorData = await completeResponse.json();
      console.error("[v0] Pi payment completion failed:", errorData);
      return NextResponse.json(
        { error: "Payment completion failed", details: errorData },
        { status: completeResponse.status }
      );
    }

    const completionData = await completeResponse.json();

    return NextResponse.json({
      success: true,
      paymentId,
      txid,
      completed: true,
      ...completionData,
    });
  } catch (error) {
    console.error("[v0] Payment completion error:", error);
    return NextResponse.json(
      { error: "Payment completion failed" },
      { status: 500 }
    );
  }
}
