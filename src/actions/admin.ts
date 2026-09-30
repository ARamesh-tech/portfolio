"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, ne, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { withDb } from "@/db/safe";
import { comments, contactMessages, posts, users } from "@/db/schema";
import { announcePost } from "@/lib/newsletter";
import { excerptFrom, readingTime, slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") throw new Error("FORBIDDEN");
  return session.user;
}

export type PostFormState = { ok: boolean; message: string; errors?: Record<string, string>; id?: string } | null;

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(160),
  slug: z.string().trim().max(120).optional().default(""),
  excerpt: z.string().trim().max(400).optional().default(""),
  content: z.string().min(1, "Write something first"),
  coverImage: z.string().trim().url("Cover image must be a full URL").or(z.literal("")).optional().default(""),
  tags: z.string().optional().default(""),
  published: z.boolean(),
  featured: z.boolean(),
});

function revalidateBlog(slug?: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
}

/** Email subscribers after the response is sent; announcePost() itself guarantees at-most-once per post. */
function scheduleAnnouncement(postId: string) {
  after(async () => {
    try {
      await withDb(() => announcePost(postId));
    } catch (err) {
      console.error("[newsletter] announcement failed:", err);
    }
  });
}

export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const user = await requireAdmin();
  const parsed = postSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug") ?? "",
    excerpt: formData.get("excerpt") ?? "",
    content: formData.get("content"),
    coverImage: formData.get("coverImage") ?? "",
    tags: formData.get("tags") ?? "",
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const d = parsed.data;
  const baseSlug = slugify(d.slug || d.title) || `post-${Date.now()}`;
  const tags = [...new Set(d.tags.split(",").map((t) => slugify(t.trim())).filter(Boolean))].slice(0, 8);
  const excerpt = d.excerpt || excerptFrom(d.content);
  const intent = formData.get("intent");

  try {
    const result = await withDb(async () => {
      // Ensure slug uniqueness (excluding this post).
      let slug = baseSlug;
      for (let i = 2; i < 50; i++) {
        const clash = await db()
          .select({ id: posts.id })
          .from(posts)
          .where(d.id ? and(eq(posts.slug, slug), ne(posts.id, d.id)) : eq(posts.slug, slug))
          .limit(1);
        if (clash.length === 0) break;
        slug = `${baseSlug}-${i}`;
      }

      if (d.id) {
        const [existing] = await db().select({ slug: posts.slug, published: posts.published, publishedAt: posts.publishedAt }).from(posts).where(eq(posts.id, d.id)).limit(1);
        if (!existing) throw new Error("NOT_FOUND");
        await db()
          .update(posts)
          .set({
            title: d.title,
            slug,
            excerpt,
            content: d.content,
            coverImage: d.coverImage || null,
            tags,
            published: d.published,
            featured: d.featured,
            publishedAt: d.published ? existing.publishedAt ?? new Date() : existing.publishedAt,
            readingTime: readingTime(d.content),
            updatedAt: new Date(),
          })
          .where(eq(posts.id, d.id));
        return { id: d.id, slug, previousSlug: existing.slug };
      }

      const [row] = await db()
        .insert(posts)
        .values({
          title: d.title,
          slug,
          excerpt,
          content: d.content,
          coverImage: d.coverImage || null,
          tags,
          published: d.published,
          featured: d.featured,
          publishedAt: d.published ? new Date() : null,
          readingTime: readingTime(d.content),
          authorId: user.id,
        })
        .returning({ id: posts.id, slug: posts.slug });
      return { id: row!.id, slug: row!.slug, previousSlug: undefined };
    });

    revalidateBlog(result.slug, result.previousSlug);
    if (d.published) scheduleAnnouncement(result.id);
    if (intent === "save-and-view" && d.published) redirect(`/blog/${result.slug}`);
    if (!d.id) redirect(`/admin/posts/${result.id}?created=1`);
    return { ok: true, message: d.published ? "Saved and published." : "Draft saved.", id: result.id };
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
    console.error("[admin] savePost failed:", err);
    return { ok: false, message: err instanceof Error && err.message === "NOT_FOUND" ? "That post no longer exists." : "Couldn't save the post. Please try again." };
  }
}

export async function togglePublish(id: string) {
  await requireAdmin();
  await withDb(async () => {
    const [row] = await db().select({ published: posts.published, publishedAt: posts.publishedAt, slug: posts.slug }).from(posts).where(eq(posts.id, id)).limit(1);
    if (!row) return;
    await db()
      .update(posts)
      .set({ published: !row.published, publishedAt: !row.published ? row.publishedAt ?? new Date() : row.publishedAt, updatedAt: new Date() })
      .where(eq(posts.id, id));
    revalidateBlog(row.slug);
    if (!row.published) scheduleAnnouncement(id);
  });
}

export async function deletePost(id: string) {
  await requireAdmin();
  await withDb(async () => {
    const [row] = await db().select({ slug: posts.slug }).from(posts).where(eq(posts.id, id)).limit(1);
    await db().delete(posts).where(eq(posts.id, id));
    revalidateBlog(row?.slug);
  });
}

export async function markMessageRead(id: string, read: boolean) {
  await requireAdmin();
  await withDb(async () => {
    await db().update(contactMessages).set({ read }).where(eq(contactMessages.id, id));
  });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await withDb(async () => {
    await db().delete(contactMessages).where(eq(contactMessages.id, id));
  });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function adminDeleteComment(id: string) {
  await requireAdmin();
  await withDb(async () => {
    const [row] = await db().select({ postId: comments.postId }).from(comments).where(eq(comments.id, id)).limit(1);
    await db().delete(comments).where(eq(comments.id, id));
    await db().delete(comments).where(eq(comments.parentId, id));
    if (row) {
      const [post] = await db().select({ slug: posts.slug }).from(posts).where(eq(posts.id, row.postId)).limit(1);
      if (post) revalidatePath(`/blog/${post.slug}`);
    }
  });
  revalidatePath("/admin/comments");
}

export type SettingsState = { ok: boolean; message: string } | null;

const passwordSchema = z
  .object({
    current: z.string().optional().default(""),
    password: z.string().min(10, "Use at least 10 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

export async function changePassword(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireAdmin();
  const parsed = passwordSchema.safeParse({
    current: formData.get("current") ?? "",
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    await withDb(async () => {
      const [row] = await db().select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
      if (row?.hash) {
        const ok = await bcrypt.compare(parsed.data.current, row.hash);
        if (!ok) throw new Error("WRONG");
      }
      await db().update(users).set({ passwordHash: await bcrypt.hash(parsed.data.password, 12) }).where(eq(users.id, user.id));
    });
    return { ok: true, message: "Password updated." };
  } catch (err) {
    if (err instanceof Error && err.message === "WRONG") return { ok: false, message: "Current password is incorrect." };
    return { ok: false, message: "Couldn't update the password right now." };
  }
}

const profileSchema = z.object({ name: z.string().trim().min(2).max(80), image: z.string().trim().url().or(z.literal("")) });

export async function updateProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireAdmin();
  const parsed = profileSchema.safeParse({ name: formData.get("name"), image: formData.get("image") ?? "" });
  if (!parsed.success) return { ok: false, message: "Enter a valid name and image URL." };
  try {
    await withDb(async () => {
      await db().update(users).set({ name: parsed.data.name, image: parsed.data.image || null }).where(eq(users.id, user.id));
    });
    revalidatePath("/blog");
    return { ok: true, message: "Profile updated. Sign out and back in to refresh your session." };
  } catch {
    return { ok: false, message: "Couldn't update the profile right now." };
  }
}
