"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Columns2, Eye, Loader2, PenLine, Save, ExternalLink, Info } from "lucide-react";
import { savePost, type PostFormState } from "@/actions/admin";
import type { Post } from "@/db/schema";
import { Markdown } from "@/components/blog/markdown";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { cn, readingTime, slugify } from "@/lib/utils";

type Mode = "write" | "split" | "preview";

const TEMPLATE = `## Why this matters

Start with the problem. What broke, what was slow, what was confusing?

## The approach

Explain the idea in plain language before the code.

\`\`\`sql
SELECT count(*) FROM events WHERE processed_at IS NULL;
\`\`\`

## What I'd do differently

Close with the lesson.
`;

export function PostEditor({ post }: { post?: Post | null }) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(savePost, null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [content, setContent] = useState(post?.content ?? TEMPLATE);
  const [mode, setMode] = useState<Mode>("split");
  const [published, setPublished] = useState(post?.published ?? false);

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  useEffect(() => {
    if (state?.ok) toast(state.message);
    else if (state && !state.ok) toast(state.message, "error");
  }, [state]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        (document.getElementById("post-form") as HTMLFormElement | null)?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const words = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);

  return (
    <form id="post-form" action={action} className="space-y-6">
      {post?.id && <input type="hidden" name="id" value={post.id} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          <Link href="/admin/posts" className="hover:text-foreground">
            Posts
          </Link>{" "}
          / <span className="text-foreground">{post ? "Edit" : "New"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-xl border bg-surface px-3 py-2 text-xs font-medium">
            <input type="checkbox" name="featured" defaultChecked={post?.featured ?? false} className="accent-[var(--accent)]" />
            Featured
          </label>
          <label
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
              published ? "border-accent/40 bg-accent-soft text-accent-strong" : "bg-surface",
            )}
          >
            <input type="checkbox" name="published" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-[var(--accent)]" />
            {published ? "Published" : "Draft"}
          </label>
          <Button type="submit" name="intent" value="save" size="sm" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save
          </Button>
          {published && (
            <Button type="submit" name="intent" value="save-and-view" size="sm" variant="secondary" disabled={pending}>
              <ExternalLink className="size-4" /> Save &amp; view
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="A clear, specific title"
              className="text-lg font-semibold"
              required
            />
            {state?.errors?.title && <p className="mt-1 text-xs text-red-500">{state.errors.title}</p>}
          </Field>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b bg-surface-2/60 px-3 py-2">
              <div className="flex items-center gap-1" role="tablist">
                {(
                  [
                    { m: "write", icon: PenLine, label: "Write" },
                    { m: "split", icon: Columns2, label: "Split" },
                    { m: "preview", icon: Eye, label: "Preview" },
                  ] as const
                ).map(({ m, icon: Icon, label }) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
                      mode === m ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" /> <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
              <span className="font-mono text-[11px] text-muted-2">
                {words} words · ~{readingTime(content)} min · Markdown + GFM
              </span>
            </div>
            <div className={cn("grid", mode === "split" && "lg:grid-cols-2")}>
              <textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck
                className={cn(
                  "focus-ring min-h-[60vh] w-full resize-y bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none",
                  mode === "preview" && "hidden",
                  mode === "split" && "lg:border-r",
                )}
              />
              <div className={cn("min-h-[60vh] overflow-auto p-5", mode === "write" && "hidden")}>
                {content.trim() ? <Markdown content={content} /> : <p className="text-sm text-muted-2">Nothing to preview yet.</p>}
              </div>
            </div>
          </div>
          {state?.errors?.content && <p className="text-xs text-red-500">{state.errors.content}</p>}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-4 p-4">
            <Field label="Slug" htmlFor="slug" hint="URL: /blog/…">
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="Excerpt" htmlFor="excerpt" hint="Optional — generated from content if blank.">
              <Textarea id="excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} className="min-h-24 text-xs" maxLength={400} />
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Comma separated, up to 8.">
              <Input id="tags" name="tags" defaultValue={post?.tags.join(", ") ?? ""} placeholder="postgres, pipelines" className="text-xs" />
            </Field>
            <Field label="Cover image URL" htmlFor="coverImage" hint="Any public image URL (Unsplash, GitHub, your CDN).">
              <Input id="coverImage" name="coverImage" defaultValue={post?.coverImage ?? ""} placeholder="https://…" className="text-xs" />
              {state?.errors?.coverImage && <p className="mt-1 text-xs text-red-500">{state.errors.coverImage}</p>}
            </Field>
          </div>
          <div className="rounded-2xl border bg-surface-2/50 p-4 text-xs leading-relaxed text-muted">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <Info className="size-3.5" /> Tips
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                Press <kbd className="rounded border bg-surface px-1 font-mono">Ctrl/⌘ S</kbd> to save.
              </li>
              <li>Headings (## / ###) become the table of contents.</li>
              <li>Fenced code blocks get syntax highlighting (```sql, ```ts …).</li>
              <li>Publishing revalidates the blog, home page and sitemap, and emails every subscriber once (never again on later edits).</li>
            </ul>
          </div>
        </aside>
      </div>
    </form>
  );
}
