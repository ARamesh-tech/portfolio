import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { posts } from "@/db/schema";

export async function POST(_req: Request, ctx: RouteContext<"/api/posts/[id]/view">) {
  const { id } = await ctx.params;
  if (!isDbConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    await ensureSchema();
    await db()
      .update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
