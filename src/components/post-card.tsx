import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import type { PostListItem } from "@/db/queries";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

export function PostCard({ post, featured = false, className }: { post: PostListItem; featured?: boolean; className?: string }) {
  return (
    <article
      className={cn(
        "card group relative flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg",
        featured && "md:flex-row",
        className,
      )}
    >
      {post.coverImage && (
        <div className={cn("relative aspect-[16/9] w-full overflow-hidden border-b", featured && "md:aspect-auto md:w-2/5 md:border-r md:border-b-0")}>
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" /> {post.readingTime} min read
          </span>
          {post.views > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" /> {post.views.toLocaleString()}
              </span>
            </>
          )}
        </div>
        <h3 className={cn("mt-2 font-display tracking-tight text-balance", featured ? "text-2xl sm:text-3xl" : "text-xl")}>
          <Link href={`/blog/${post.slug}`} className="focus-ring rounded after:absolute after:inset-0 hover:text-accent-strong">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {post.tags.slice(0, 4).map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
