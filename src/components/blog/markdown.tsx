import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose-blog prose prose-neutral max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={{
          a({ href, children, ...props }) {
            const url = href ?? "#";
            if (url.startsWith("/")) {
              return (
                <Link href={url} {...props}>
                  {children}
                </Link>
              );
            }
            const external = /^https?:\/\//.test(url);
            return (
              <a href={url} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined} {...props}>
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export type Heading = { id: string; text: string; level: 2 | 3 };

/** Mirror rehype-slug's github-slugger behaviour closely enough for TOC anchors. */
export function extractHeadings(markdown: string): Heading[] {
  const out: Heading[] = [];
  const seen = new Map<string, number>();
  const body = markdown.replace(/```[\s\S]*?```/g, "");
  for (const line of body.split("\n")) {
    const m = /^(##|###)\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = m[2]!.replace(/[*_`~]/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").trim();
    let id = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-");
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n > 0) id = `${id}-${n}`;
    out.push({ id, text, level: m[1] === "##" ? 2 : 3 });
  }
  return out;
}
