import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock, Eye } from "lucide-react";
import { getAdjacentPosts, getPostBySlug } from "@/db/queries";
import { site } from "@/lib/site";
import { absoluteUrl, formatDate } from "@/lib/utils";
import { Markdown, extractHeadings } from "@/components/blog/markdown";
import { TableOfContents } from "@/components/blog/toc";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { Engagement } from "@/components/blog/engagement";
import { NewsletterCard } from "@/components/newsletter/newsletter-card";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPostBySlug(slug);
  if (!row) return { title: "Post not found" };
  const { post } = row;
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [site.name],
      tags: post.tags,
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const row = await getPostBySlug(slug);
  if (!row) notFound();
  const { post, author } = row;
  const headings = extractHeadings(post.content);
  const adjacent = post.publishedAt ? await getAdjacentPosts(post.publishedAt) : { prev: null, next: null };
  const url = absoluteUrl(`/blog/${post.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: site.name, url: site.url },
    image: post.coverImage ? [post.coverImage] : undefined,
    mainEntityOfPage: url,
    keywords: post.tags.join(", "),
  };

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <Link href="/blog" className="focus-ring inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" /> All posts
        </Link>

        <header className="mt-6 max-w-3xl animate-fade-up">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`}>
                  <Badge tone="accent">#{t}</Badge>
                </Link>
              ))}
            </div>
          )}
          <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">{post.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted text-pretty">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <Image src={author?.image ?? site.photo} alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
              <span className="font-medium text-foreground">{author?.name ?? site.name}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt, { year: "numeric", month: "long", day: "numeric" })}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" /> {post.readingTime} min read
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" /> {post.views.toLocaleString()} views
            </span>
          </div>
        </header>

        {post.coverImage && (
          <div className="relative mt-8 aspect-[21/9] w-full overflow-hidden rounded-3xl border shadow-soft">
            <Image src={post.coverImage} alt="" fill priority sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <Markdown content={post.content} className="prose-lg" />
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
              <ShareButtons url={url} title={post.title} />
              <p className="text-xs text-muted-2">Last updated {formatDate(post.updatedAt)}</p>
            </div>
            <Engagement postId={post.id} />

            <nav className="mt-12 grid gap-3 sm:grid-cols-2" aria-label="More posts">
              {adjacent.prev ? (
                <Link href={`/blog/${adjacent.prev.slug}`} className="card focus-ring group p-4 transition-colors hover:border-border-strong">
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <ArrowLeft className="size-3" /> Previous
                  </span>
                  <p className="mt-1 text-sm font-medium group-hover:text-accent-strong">{adjacent.prev.title}</p>
                </Link>
              ) : (
                <span />
              )}
              {adjacent.next && (
                <Link href={`/blog/${adjacent.next.slug}`} className="card focus-ring group p-4 text-right transition-colors hover:border-border-strong">
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    Next <ArrowRight className="size-3" />
                  </span>
                  <p className="mt-1 text-sm font-medium group-hover:text-accent-strong">{adjacent.next.title}</p>
                </Link>
              )}
            </nav>
          </div>

          <aside className="no-print hidden lg:block">
            <div className="sticky top-8 space-y-8">
              <TableOfContents headings={headings} />
              <NewsletterCard />
              <ShareButtons url={url} title={post.title} compact />
            </div>
          </aside>
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
