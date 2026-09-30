import { NextResponse, type NextRequest } from "next/server";
import { isDbConfigured } from "@/db";
import { withDb } from "@/db/safe";
import { deactivateSubscription } from "@/lib/newsletter";

/** RFC 8058 one-click unsubscribe target (mail clients POST here from the List-Unsubscribe header). */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || !isDbConfigured()) return new NextResponse("Invalid token", { status: 400 });
  try {
    await withDb(() => deactivateSubscription({ token }));
    return new NextResponse("Unsubscribed", { status: 200 });
  } catch {
    return new NextResponse("Unavailable", { status: 503 });
  }
}

/** Humans following the header link land on the confirmation page instead. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  return NextResponse.redirect(new URL(`/unsubscribe?token=${encodeURIComponent(token)}`, req.nextUrl.origin));
}
