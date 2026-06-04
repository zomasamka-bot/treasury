import { NextResponse } from "next/server";

export async function GET() {
  try {
    const piApiKey = process.env.PI_API_KEY;
    const hasApiKey = !!piApiKey;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      piSdkConfigured: hasApiKey,
      endpoints: {
        auth: "/api/auth/signin",
        paymentApprove: "/api/payments/approve",
        paymentComplete: "/api/payments/complete",
        paymentIncomplete: "/api/payments/incomplete",
      },
    });
  } catch (error) {
    console.error("[v0] Health check error:", error);
    return NextResponse.json(
      { 
        status: "unhealthy",
        error: "Health check failed" 
      },
      { status: 500 }
    );
  }
}
