import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getComments, getReactions } from "@/db/queries";

export async function GET(_req: Request, ctx: RouteContext<"/api/posts/[id]/engagement">) {
  const { id } = await ctx.params;
  const session = await auth();
  const userId = session?.user?.id;
  const [reactions, comments] = await Promise.all([getReactions(id, userId), getComments(id)]);
  return NextResponse.json(
    {
      reactions,
      comments,
      viewer: session?.user ? { id: session.user.id, name: session.user.name, image: session.user.image, role: session.user.role } : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
