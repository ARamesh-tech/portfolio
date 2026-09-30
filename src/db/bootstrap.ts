import bcrypt from "bcryptjs";
import { getPool, isDbConfigured } from "./index";

/**
 * Idempotent schema bootstrap. Runs once per server instance so the site works
 * the moment DATABASE_URL is configured, without a separate migration step.
 * `npm run db:push` (drizzle-kit) is available for local development as well.
 */
const DDL = `
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text,
  "email" text UNIQUE,
  "emailVerified" timestamp,
  "image" text,
  "password_hash" text,
  "role" text NOT NULL DEFAULT 'user',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "account" (
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "providerAccountId")
);

CREATE TABLE IF NOT EXISTS "session" (
  "sessionToken" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "expires" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "verificationToken" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

CREATE TABLE IF NOT EXISTS "post" (
  "id" text PRIMARY KEY,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "excerpt" text NOT NULL DEFAULT '',
  "content" text NOT NULL DEFAULT '',
  "cover_image" text,
  "tags" text[] NOT NULL DEFAULT '{}',
  "published" boolean NOT NULL DEFAULT false,
  "featured" boolean NOT NULL DEFAULT false,
  "published_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "author_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "views" integer NOT NULL DEFAULT 0,
  "reading_time" integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS "post_slug_idx" ON "post" ("slug");
CREATE INDEX IF NOT EXISTS "post_published_idx" ON "post" ("published", "published_at");

CREATE TABLE IF NOT EXISTS "comment" (
  "id" text PRIMARY KEY,
  "post_id" text NOT NULL REFERENCES "post"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "parent_id" text,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "comment_post_idx" ON "comment" ("post_id", "created_at");

CREATE TABLE IF NOT EXISTS "reaction" (
  "post_id" text NOT NULL REFERENCES "post"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("post_id", "user_id", "type")
);

CREATE TABLE IF NOT EXISTS "contact_message" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "subject" text NOT NULL DEFAULT '',
  "message" text NOT NULL,
  "read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "subscriber" (
  "email" text PRIMARY KEY,
  "user_id" text,
  "token" text,
  "active" boolean NOT NULL DEFAULT true,
  "welcomed_at" timestamp,
  "unsubscribed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Additive migrations for databases created by an earlier version of this schema.
ALTER TABLE "post" ADD COLUMN IF NOT EXISTS "announced_at" timestamp;
ALTER TABLE "contact_message" ADD COLUMN IF NOT EXISTS "user_id" text;
ALTER TABLE "subscriber" ADD COLUMN IF NOT EXISTS "user_id" text;
ALTER TABLE "subscriber" ADD COLUMN IF NOT EXISTS "token" text;
ALTER TABLE "subscriber" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true;
ALTER TABLE "subscriber" ADD COLUMN IF NOT EXISTS "welcomed_at" timestamp;
ALTER TABLE "subscriber" ADD COLUMN IF NOT EXISTS "unsubscribed_at" timestamp;
CREATE UNIQUE INDEX IF NOT EXISTS "subscriber_token_idx" ON "subscriber" ("token");
`;

const WELCOME_POST = {
  slug: "hello-world-building-this-portfolio",
  title: "Hello, world: how I built this portfolio (and why it has a terminal)",
  excerpt:
    "A look under the hood of this site — Next.js 16, Aiven Postgres, Auth.js, and a few opinions about what a backend engineer's portfolio should actually do.",
  tags: ["nextjs", "postgres", "portfolio", "engineering"],
  content: `Most portfolios are static brochures. I wanted mine to behave like the systems I enjoy building: a real backend, a real database, real auth, and a few small things that reward curiosity.

## The stack

- **Next.js 16 (App Router)** with React Server Components for the pages you're reading now.
- **PostgreSQL on Aiven** for posts, comments, reactions, and contact messages.
- **Drizzle ORM** for type-safe queries and an idempotent schema bootstrap.
- **Auth.js** with Google sign-in plus classic email/password registration.
- **Vercel** for hosting, analytics, and OG image generation.

## What's different here

1. **A terminal on the home page.** Type \`help\` and poke around. It knows my skills, experience, and how to reach me.
2. **A command palette** (\`Ctrl/⌘ + K\`) for keyboard-first navigation.
3. **Comments and reactions that require sign-in.** Guests can read everything; the moment you want to react or reply, you log in with Google or register — that keeps the conversation human.
4. **An admin console** where I write posts in Markdown with a live preview and publish with one click.

## A tiny code sample

The reading-time estimate is deliberately boring:

\`\`\`ts
export function readingTime(markdown: string) {
  const words = markdown.split(/\\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
\`\`\`

## What's next

I'll write here about backend architecture, data pipelines, and things I learn on the job at Simpplr. If you have a topic you'd like me to cover, [say hello](/contact).
`,
};

async function seed() {
  const pool = getPool();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  let adminId: string | null = null;

  if (adminEmail) {
    const existing = await pool.query<{ id: string; password_hash: string | null; role: string }>(
      `SELECT id, password_hash, role FROM "user" WHERE lower(email) = $1`,
      [adminEmail],
    );
    if (existing.rowCount === 0) {
      const id = crypto.randomUUID();
      const hash = adminPassword ? await bcrypt.hash(adminPassword, 12) : null;
      await pool.query(
        `INSERT INTO "user" (id, name, email, "emailVerified", password_hash, role) VALUES ($1, $2, $3, now(), $4, 'admin')`,
        [id, "A Ramesh Kumaran", adminEmail, hash],
      );
      adminId = id;
    } else {
      const row = existing.rows[0]!;
      adminId = row.id;
      const updates: string[] = [];
      const params: unknown[] = [];
      if (row.role !== "admin") {
        params.push("admin");
        updates.push(`role = $${params.length}`);
      }
      if (!row.password_hash && adminPassword) {
        params.push(await bcrypt.hash(adminPassword, 12));
        updates.push(`password_hash = $${params.length}`);
      }
      if (updates.length) {
        params.push(row.id);
        await pool.query(`UPDATE "user" SET ${updates.join(", ")} WHERE id = $${params.length}`, params);
      }
    }
  }

  const postCount = await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM "post"`);
  if (Number(postCount.rows[0]?.n ?? "0") === 0) {
    await pool.query(
      `INSERT INTO "post" (id, slug, title, excerpt, content, tags, published, featured, published_at, author_id, reading_time)
       VALUES ($1, $2, $3, $4, $5, $6, true, true, now(), $7, 3)`,
      [
        crypto.randomUUID(),
        WELCOME_POST.slug,
        WELCOME_POST.title,
        WELCOME_POST.excerpt,
        WELCOME_POST.content,
        WELCOME_POST.tags,
        adminId,
      ],
    );
  }
}

const globalForBootstrap = globalThis as unknown as { __schemaReady?: Promise<void> };

export function ensureSchema(): Promise<void> {
  if (!isDbConfigured()) return Promise.reject(new Error("DATABASE_URL is not configured"));
  if (!globalForBootstrap.__schemaReady) {
    globalForBootstrap.__schemaReady = (async () => {
      const pool = getPool();
      await pool.query(DDL);
      await seed();
    })().catch((err) => {
      globalForBootstrap.__schemaReady = undefined;
      throw err;
    });
  }
  return globalForBootstrap.__schemaReady;
}
