import { NextResponse } from "next/server";

export async function GET() {
  // Treasury Action is approval-only, no products to sell
  return NextResponse.json({
    products: [],
  });
}
