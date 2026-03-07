export async function GET() {
  console.log("[v0] /api/test-auth - Test endpoint called");
  
  const piApiKey = process.env.PI_API_KEY;
  const appId = process.env.NEXT_PUBLIC_PI_APP_ID;
  
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      hasApiKey: !!piApiKey,
      apiKeyLength: piApiKey?.length || 0,
      appId: appId || "not set",
      nodeEnv: process.env.NODE_ENV,
    }
  });
}

export async function POST() {
  return GET();
}
