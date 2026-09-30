import { and, desc, eq, ilike, or, sql, count } from "drizzle-orm";
import { db } from "./index";
import { safeQuery } from "./safe";
import { comments, contactMessages, posts, reactions, users, type ReactionType } from "./schema";

export type PostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  tags: string[];
  publishedAt: Date | null;
  readingTime: number;
  views: number;
  featured: boolean;
  published: boolean;
  updatedAt: Date;
};

const listColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  coverImage: posts.coverImage,
  tags: posts.tags,
  publishedAt: posts.publishedAt,
  readingTime: posts.readingTime,
  views: posts.views,
  featured: posts.featured,
  published: posts.published,
  updatedAt: posts.updatedAt,
};

export async function getPublishedPosts(opts: { q?: string; tag?: string; limit?: number } = {}) {
  return safeQuery(async () => {
    const conditions = [eq(posts.published, true)];
    if (opts.q) {
      const like = `%${opts.q}%`;
      conditions.push(or(ilike(posts.title, like), ilike(posts.excerpt, like), ilike(posts.content, like))!);
    }
    if (opts.tag) {
      conditions.push(sql`${opts.tag} = ANY(${posts.tags})`);
    }
    const query = db()
      .select(listColumns)
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.publishedAt));
    return (opts.limit ? await query.limit(opts.limit) : await query) as PostListItem[];
  }, [] as PostListItem[]);
}

export async function getAllTags() {
  return safeQuery(async () => {
    const rows = await db().execute<{ tag: string; n: number }>(
      sql`SELECT t AS tag, count(*)::int AS n FROM "post", unnest(tags) AS t WHERE published = true GROUP BY t ORDER BY n DESC, t ASC`,
    );
    return rows.rows;
  }, [] as { tag: string; n: number }[]);
}

export async function getPostBySlug(slug: string, { includeDrafts = false } = {}) {
  return safeQuery(async () => {
    const [row] = await db()
      .select({
        post: posts,
        author: { id: users.id, name: users.name, image: users.image },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(includeDrafts ? eq(posts.slug, slug) : and(eq(posts.slug, slug), eq(posts.published, true)))
      .limit(1);
    return row ?? null;
  }, null);
}

type PostLink = { slug: string; title: string } | null;

export async function getAdjacentPosts(publishedAt: Date) {
  return safeQuery<{ prev: PostLink; next: PostLink }>(async () => {
    const [prev] = await db()
      .select({ slug: posts.slug, title: posts.title })
      .from(posts)
      .where(and(eq(posts.published, true), sql`${posts.publishedAt} < ${publishedAt}`))
      .orderBy(desc(posts.publishedAt))
      .limit(1);
    const [next] = await db()
      .select({ slug: posts.slug, title: posts.title })
      .from(posts)
      .where(and(eq(posts.published, true), sql`${posts.publishedAt} > ${publishedAt}`))
      .orderBy(posts.publishedAt)
      .limit(1);
    return { prev: prev ?? null, next: next ?? null };
  }, { prev: null, next: null });
}

export type CommentWithUser = {
  id: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  user: { id: string; name: string | null; image: string | null; role: string };
};

export async function getComments(postId: string) {
  return safeQuery(async () => {
    const rows = await db()
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        parentId: comments.parentId,
        user: { id: users.id, name: users.name, image: users.image, role: users.role },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
    return rows as CommentWithUser[];
  }, [] as CommentWithUser[]);
}

export type ReactionSummary = { counts: Record<ReactionType, number>; mine: ReactionType[] };

export async function getReactions(postId: string, userId?: string): Promise<ReactionSummary> {
  const empty: ReactionSummary = { counts: { like: 0, love: 0, insightful: 0, fire: 0 }, mine: [] };
  return safeQuery(async () => {
    const rows = await db()
      .select({ type: reactions.type, n: count() })
      .from(reactions)
      .where(eq(reactions.postId, postId))
      .groupBy(reactions.type);
    const counts = { ...empty.counts };
    for (const r of rows) counts[r.type] = Number(r.n);
    let mine: ReactionType[] = [];
    if (userId) {
      const mineRows = await db()
        .select({ type: reactions.type })
        .from(reactions)
        .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId)));
      mine = mineRows.map((r) => r.type);
    }
    return { counts, mine };
  }, empty);
}

export async function getPostSlugsForSitemap() {
  return safeQuery(async () => {
    return db()
      .select({ slug: posts.slug, updatedAt: posts.updatedAt })
      .from(posts)
      .where(eq(posts.published, true));
  }, [] as { slug: string; updatedAt: Date }[]);
}

/* ---------- Admin ---------- */

export async function getAllPostsAdmin() {
  return safeQuery(async () => {
    const rows = await db()
      .select({
        ...listColumns,
        // Fully qualify the outer column: drizzle renders `${posts.id}` as a bare "id" here, which would resolve to c.id.
        commentCount: sql<number>`(SELECT count(*)::int FROM "comment" c WHERE c.post_id = "post"."id")`,
      })
      .from(posts)
      .orderBy(desc(posts.updatedAt));
    return rows as (PostListItem & { commentCount: number })[];
  }, [] as (PostListItem & { commentCount: number })[]);
}

export async function getPostByIdAdmin(id: string) {
  return safeQuery(async () => {
    const [row] = await db().select().from(posts).where(eq(posts.id, id)).limit(1);
    return row ?? null;
  }, null);
}

export async function getContactMessages() {
  return safeQuery(async () => {
    return db().select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }, [] as (typeof contactMessages.$inferSelect)[]);
}

export async function getRecentCommentsAdmin(limit = 50) {
  return safeQuery(async () => {
    return db()
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        postSlug: posts.slug,
        postTitle: posts.title,
        userName: users.name,
        userEmail: users.email,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .innerJoin(users, eq(comments.userId, users.id))
      .orderBy(desc(comments.createdAt))
      .limit(limit);
  }, [] as { id: string; content: string; createdAt: Date; postSlug: string; postTitle: string; userName: string | null; userEmail: string | null }[]);
}

export async function getAdminStats() {
  const empty = { posts: 0, published: 0, views: 0, comments: 0, messages: 0, unread: 0, users: 0, subscribers: 0 };
  return safeQuery(async () => {
    const rows = await db().execute<Record<keyof typeof empty, number>>(sql`
      SELECT
        (SELECT count(*)::int FROM "post") AS posts,
        (SELECT count(*)::int FROM "post" WHERE published) AS published,
        (SELECT coalesce(sum(views),0)::int FROM "post") AS views,
        (SELECT count(*)::int FROM "comment") AS comments,
        (SELECT count(*)::int FROM "contact_message") AS messages,
        (SELECT count(*)::int FROM "contact_message" WHERE NOT read) AS unread,
        (SELECT count(*)::int FROM "user") AS users,
        (SELECT count(*)::int FROM "subscriber" WHERE active) AS subscribers
    `);
    return rows.rows[0] ?? empty;
  }, empty);
}
