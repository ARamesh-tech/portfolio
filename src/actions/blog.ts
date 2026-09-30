"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { withDb } from "@/db/safe";
import { comments, posts, reactions, REACTION_TYPES, type ReactionType } from "@/db/schema";
import { getComments, getReactions } from "@/db/queries";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user;
}

export async function toggleReaction(postId: string, type: ReactionType) {
  if (!REACTION_TYPES.includes(type)) throw new Error("Invalid reaction");
  const user = await requireUser();
  return withDb(async () => {
    const existing = await db()
      .select({ type: reactions.type })
      .from(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, user.id), eq(reactions.type, type)))
      .limit(1);
    if (existing.length) {
      await db().delete(reactions).where(and(eq(reactions.postId, postId), eq(reactions.userId, user.id), eq(reactions.type, type)));
    } else {
      await db().insert(reactions).values({ postId, userId: user.id, type }).onConflictDoNothing();
    }
    return getReactions(postId, user.id);
  });
}

const commentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().trim().min(2, "Say a little more").max(2000, "Keep it under 2000 characters"),
  parentId: z.string().optional().nullable(),
});

export async function addComment(input: { postId: string; content: string; parentId?: string | null }) {
  const user = await requireUser();
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Invalid comment" };
  return withDb(async () => {
    const [post] = await db().select({ id: posts.id, slug: posts.slug, published: posts.published }).from(posts).where(eq(posts.id, parsed.data.postId)).limit(1);
    if (!post || (!post.published && user.role !== "admin")) return { ok: false as const, message: "Post not found" };
    await db().insert(comments).values({
      postId: parsed.data.postId,
      userId: user.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    });
    revalidatePath(`/blog/${post.slug}`);
    return { ok: true as const, comments: await getComments(parsed.data.postId) };
  });
}

export async function deleteComment(commentId: string) {
  const user = await requireUser();
  return withDb(async () => {
    const [row] = await db().select({ id: comments.id, userId: comments.userId, postId: comments.postId }).from(comments).where(eq(comments.id, commentId)).limit(1);
    if (!row) return { ok: false as const, message: "Comment not found" };
    if (row.userId !== user.id && user.role !== "admin") return { ok: false as const, message: "Not allowed" };
    await db().delete(comments).where(eq(comments.id, commentId));
    await db().delete(comments).where(eq(comments.parentId, commentId));
    return { ok: true as const, comments: await getComments(row.postId) };
  });
}
