import { NextResponse } from "next/server";
import { mySubscriptionStatus } from "@/actions/newsletter";

export async function GET() {
  const status = await mySubscriptionStatus();
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}
