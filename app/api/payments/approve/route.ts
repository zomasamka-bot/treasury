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

    // Approve the payment with Pi Network
    // For approval-only apps, we approve immediately without processing funds
    const approveResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${piApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!approveResponse.ok) {
      const errorData = await approveResponse.json();
      console.error("[v0] Pi payment approval failed:", errorData);
      return NextResponse.json(
        { error: "Payment approval failed", details: errorData },
        { status: approveResponse.status }
      );
    }

    const approvalData = await approveResponse.json();

    return NextResponse.json({
      success: true,
      paymentId,
      approved: true,
      ...approvalData,
    });
  } catch (error) {
    console.error("[v0] Payment approval error:", error);
    return NextResponse.json(
      { error: "Payment approval failed" },
      { status: 500 }
    );
  }
}
