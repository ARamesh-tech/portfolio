import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search, X } from "lucide-react";
import { getAllTags, getPublishedPosts } from "@/db/queries";
import { getDbHealth } from "@/db/health";
import { Container, PageHeader } from "@/components/ui/page-header";
import { PostCard } from "@/components/post-card";
import { NewsletterCard } from "@/components/newsletter/newsletter-card";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on backend engineering, data pipelines, PostgreSQL, and lessons from building real systems — by A Ramesh Kumaran.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage(props: PageProps<"/blog">) {
  return (
    <>
      <Container size="wide">
        <PageHeader
          eyebrow="Blog"
          title={
            <>
              Notes from the <em className="text-accent-strong italic">backend</em>.
            </>
          }
          description="Long-form thinking on data engineering, APIs, databases and the craft of shipping software. Read freely — sign in to react, comment or subscribe."
        />
        <Suspense fallback={<BlogSkeleton />}>
          <BlogContent searchParams={props.searchParams} />
        </Suspense>
      </Container>
      <SiteFooter />
    </>
  );
}

async function BlogContent({ searchParams }: Pick<PageProps<"/blog">, "searchParams">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tag = typeof sp.tag === "string" ? sp.tag.trim() : "";
  const [posts, tags] = await Promise.all([getPublishedPosts({ q: q || undefined, tag: tag || undefined }), getAllTags()]);
  const filtering = Boolean(q || tag);
  const [featured, ...rest] = !filtering ? posts : [];
  const list = filtering ? posts : rest;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <NewsletterCard variant="banner" />
        <form className="relative" action="/blog">
          {tag && <input type="hidden" name="tag" value={tag} />}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-2" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search posts…"
            className="focus-ring w-full rounded-2xl border bg-surface py-3 pr-4 pl-11 text-sm placeholder:text-muted-2"
          />
        </form>

        {filtering && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>
              {posts.length} result{posts.length === 1 ? "" : "s"}
              {q && (
                <>
                  {" "}
                  for <strong className="text-foreground">&ldquo;{q}&rdquo;</strong>
                </>
              )}
              {tag && (
                <>
                  {" "}
                  tagged <strong className="text-foreground">#{tag}</strong>
                </>
              )}
            </span>
            <Link href="/blog" className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:text-foreground">
              <X className="size-3" /> Clear
            </Link>
          </div>
        )}

        {posts.length === 0 ? (
          <EmptyState filtering={filtering} />
        ) : (
          <>
            {featured && <PostCard post={featured} featured />}
            {list.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <NewsletterCard />
        {tags.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold">Topics</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Link
                  key={t.tag}
                  href={tag === t.tag ? "/blog" : `/blog?tag=${encodeURIComponent(t.tag)}`}
                  className={cn(
                    "focus-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-border-strong",
                    tag === t.tag ? "border-foreground bg-foreground text-background" : "bg-surface text-muted",
                  )}
                >
                  #{t.tag} <span className="font-mono text-[10px] opacity-70">{t.n}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

async function EmptyState({ filtering }: { filtering: boolean }) {
  const health = filtering ? null : await getDbHealth();
  const detail = filtering
    ? "Try a different search or tag."
    : !health?.configured
      ? "The blog database isn't connected yet — posts will appear once it is."
      : !health.ok
        ? "The blog database is temporarily unreachable. Please check back in a few minutes."
        : "The first posts are being written. Subscribe to hear when they land.";
  return (
    <div className="card p-10 text-center">
      <p className="font-display text-2xl">Nothing here yet</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
      {health && !health.ok && process.env.NODE_ENV !== "production" && health.error && (
        <p className="mx-auto mt-4 max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left font-mono text-[11px] text-amber-700 dark:text-amber-300">
          dev only: {health.error}
        </p>
      )}
    </div>
  );
}

function BlogSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded-2xl border bg-surface-2/40" />
        <div className="h-64 animate-pulse rounded-2xl border bg-surface-2/40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl border bg-surface-2/40" />
          <div className="h-56 animate-pulse rounded-2xl border bg-surface-2/40" />
        </div>
      </div>
      <div className="h-40 animate-pulse rounded-2xl border bg-surface-2/40" />
    </div>
  );
}
