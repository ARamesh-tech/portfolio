import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { posts, subscribers, type Subscriber } from "@/db/schema";
import { newPostEmail, welcomeEmail } from "@/lib/email-templates";
import { sendMany, sendMail } from "@/lib/mail";
import { absoluteUrl } from "@/lib/utils";

const postSummaryColumns = {
  title: posts.title,
  slug: posts.slug,
  excerpt: posts.excerpt,
  publishedAt: posts.publishedAt,
  readingTime: posts.readingTime,
  tags: posts.tags,
};

export function unsubscribeUrl(token: string) {
  return absoluteUrl(`/unsubscribe?token=${encodeURIComponent(token)}`);
}

function unsubscribeHeaders(token: string) {
  // RFC 8058 one-click unsubscribe, honoured by Gmail/Outlook/Apple Mail.
  return {
    "List-Unsubscribe": `<${absoluteUrl(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export async function getSubscription(email: string) {
  const [row] = await db().select().from(subscribers).where(eq(subscribers.email, email.toLowerCase())).limit(1);
  return row ?? null;
}

async function withToken(sub: Subscriber): Promise<Subscriber & { token: string }> {
  if (sub.token) return sub as Subscriber & { token: string };
  const token = crypto.randomUUID();
  await db().update(subscribers).set({ token }).where(eq(subscribers.email, sub.email));
  return { ...sub, token };
}

/**
 * Subscribe (or re-activate) an email. Returns whether a welcome email should be sent.
 */
export async function upsertSubscription({ email, userId }: { email: string; userId?: string | null }) {
  const normalized = email.toLowerCase().trim();
  const existing = await getSubscription(normalized);
  if (!existing) {
    const [row] = await db()
      .insert(subscribers)
      .values({ email: normalized, userId: userId ?? null, token: crypto.randomUUID(), active: true })
      .returning();
    return { subscriber: row!, changed: true, needsWelcome: true };
  }
  const changed = !existing.active || (userId && !existing.userId);
  if (changed) {
    await db()
      .update(subscribers)
      .set({ active: true, unsubscribedAt: null, userId: existing.userId ?? userId ?? null })
      .where(eq(subscribers.email, normalized));
  }
  return { subscriber: { ...existing, active: true }, changed: Boolean(changed), needsWelcome: !existing.welcomedAt };
}

export async function deactivateSubscription(where: { email?: string; token?: string }) {
  const cond = where.token ? eq(subscribers.token, where.token) : where.email ? eq(subscribers.email, where.email.toLowerCase()) : null;
  if (!cond) return null;
  const [row] = await db().update(subscribers).set({ active: false, unsubscribedAt: new Date() }).where(cond).returning();
  return row ?? null;
}

export async function reactivateByToken(token: string) {
  const [row] = await db().update(subscribers).set({ active: true, unsubscribedAt: null }).where(eq(subscribers.token, token)).returning();
  return row ?? null;
}

export async function getSubscriptionByToken(token: string) {
  const [row] = await db().select().from(subscribers).where(eq(subscribers.token, token)).limit(1);
  return row ?? null;
}

/** One-time welcome email listing recent posts. Safe to call repeatedly; only sends once. */
export async function sendWelcomeEmail(email: string, name?: string | null) {
  const sub = await getSubscription(email);
  if (!sub || !sub.active || sub.welcomedAt) return;
  const withTok = await withToken(sub);
  const recentPosts = await db()
    .select(postSummaryColumns)
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt))
    .limit(3);
  const mail = welcomeEmail({ name, recentPosts, unsubscribeUrl: unsubscribeUrl(withTok.token) });
  const result = await sendMail({ to: sub.email, ...mail, headers: unsubscribeHeaders(withTok.token) });
  if (result.ok) {
    await db().update(subscribers).set({ welcomedAt: new Date() }).where(eq(subscribers.email, sub.email));
  }
  return result;
}

/**
 * Email every active subscriber about a newly published post. Runs at most once per post
 * (tracked by post.announced_at), so re-publishing or editing never re-sends.
 */
export async function announcePost(postId: string) {
  const [post] = await db()
    .select({ id: posts.id, published: posts.published, announcedAt: posts.announcedAt, ...postSummaryColumns })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.published, true), isNull(posts.announcedAt)))
    .limit(1);
  if (!post) return { sent: 0, skipped: true };

  // Claim the announcement first so concurrent publishes don't double-send.
  const claimed = await db()
    .update(posts)
    .set({ announcedAt: new Date() })
    .where(and(eq(posts.id, postId), isNull(posts.announcedAt)))
    .returning({ id: posts.id });
  if (claimed.length === 0) return { sent: 0, skipped: true };

  const recipients = await db().select().from(subscribers).where(eq(subscribers.active, true));
  if (recipients.length === 0) return { sent: 0, skipped: false };

  const messages = [];
  for (const sub of recipients) {
    const withTok = await withToken(sub);
    const mail = newPostEmail({ post, unsubscribeUrl: unsubscribeUrl(withTok.token) });
    messages.push({ to: sub.email, ...mail, headers: unsubscribeHeaders(withTok.token) });
  }
  const results = await sendMany(messages);
  const sent = results.filter((r) => r.ok).length;
  if (sent === 0 && results.some((r) => !r.ok && "skipped" in r && r.skipped)) {
    // Nothing was delivered because email isn't configured — leave the post announceable later.
    await db().update(posts).set({ announcedAt: null }).where(eq(posts.id, postId));
  }
  console.info(`[newsletter] "${post.title}" announced to ${sent}/${recipients.length} subscriber(s).`);
  return { sent, skipped: false };
}
