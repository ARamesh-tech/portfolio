"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart, ThumbsUp, Lightbulb, Flame, Loader2, MessageSquare, Trash2, Reply, LogIn, ShieldCheck } from "lucide-react";
import type { ReactionType } from "@/db/schema";
import type { CommentWithUser, ReactionSummary } from "@/db/queries";
import { addComment, deleteComment, toggleReaction } from "@/actions/blog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { cn, initialsOf, timeAgo } from "@/lib/utils";

type Viewer = { id: string; name: string | null; image: string | null; role: "admin" | "user" } | null;

type Payload = { reactions: ReactionSummary; comments: CommentWithUser[]; viewer: Viewer };

const reactionMeta: { type: ReactionType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { type: "like", icon: ThumbsUp, label: "Like" },
  { type: "love", icon: Heart, label: "Love" },
  { type: "insightful", icon: Lightbulb, label: "Insightful" },
  { type: "fire", icon: Flame, label: "Fire" },
];

export function Engagement({ postId }: { postId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/posts/${postId}/engagement`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<Payload>;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // Count the view once per session per post.
  useEffect(() => {
    const key = `viewed:${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/posts/${postId}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [postId]);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname)}`;

  return (
    <section id="discussion" className="mt-12 space-y-8 border-t pt-10">
      <Reactions postId={postId} data={data} error={error} loginHref={loginHref} onChange={(r) => setData((d) => (d ? { ...d, reactions: r } : d))} />
      <Comments postId={postId} data={data} error={error} loginHref={loginHref} onChange={(c) => setData((d) => (d ? { ...d, comments: c } : d))} />
    </section>
  );
}

function Reactions({
  postId,
  data,
  error,
  loginHref,
  onChange,
}: {
  postId: string;
  data: Payload | null;
  error: boolean;
  loginHref: string;
  onChange: (r: ReactionSummary) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<ReactionType | null>(null);

  const total = data ? Object.values(data.reactions.counts).reduce((a, b) => a + b, 0) : 0;

  const react = (type: ReactionType) => {
    if (!data) return;
    if (!data.viewer) {
      toast("Sign in to react to this post", "info");
      window.location.assign(loginHref);
      return;
    }
    setBusy(type);
    startTransition(async () => {
      try {
        const next = await toggleReaction(postId, type);
        onChange(next);
      } catch {
        toast("Couldn't save your reaction", "error");
      } finally {
        setBusy(null);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="mr-1 text-sm font-medium">
        {total > 0 ? `${total} reaction${total === 1 ? "" : "s"}` : "Enjoyed this?"}
      </p>
      <div className="flex flex-wrap gap-2">
        {reactionMeta.map(({ type, icon: Icon, label }) => {
          const count = data?.reactions.counts[type] ?? 0;
          const mine = data?.reactions.mine.includes(type);
          return (
            <button
              key={type}
              type="button"
              disabled={!data || pending}
              onClick={() => react(type)}
              aria-pressed={mine}
              aria-label={`${label} (${count})`}
              className={cn(
                "focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-all hover:-translate-y-0.5 hover:border-border-strong disabled:opacity-60",
                mine ? "border-accent/40 bg-accent-soft text-accent-strong" : "bg-surface text-muted",
              )}
            >
              {busy === type ? <Loader2 className="size-4 animate-spin" /> : <Icon className={cn("size-4", mine && "fill-current")} />}
              <span className="font-mono text-xs tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>
      {data && !data.viewer && (
        <Link href={loginHref} className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline">
          Sign in to react
        </Link>
      )}
      {error && <span className="text-xs text-muted-2">Reactions unavailable right now.</span>}
    </div>
  );
}

function Comments({
  postId,
  data,
  error,
  loginHref,
  onChange,
}: {
  postId: string;
  data: Payload | null;
  error: boolean;
  loginHref: string;
  onChange: (c: CommentWithUser[]) => void;
}) {
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<CommentWithUser | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!data?.viewer) return;
    startTransition(async () => {
      try {
        const res = await addComment({ postId, content, parentId: replyTo?.id ?? null });
        if (!res.ok) {
          toast(res.message, "error");
          return;
        }
        onChange(res.comments);
        setContent("");
        setReplyTo(null);
        toast("Comment posted");
      } catch {
        toast("Couldn't post your comment", "error");
      }
    });
  };

  const remove = (id: string) => {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      try {
        const res = await deleteComment(id);
        if (!res.ok) {
          toast(res.message, "error");
          return;
        }
        onChange(res.comments);
        toast("Comment deleted");
      } catch {
        toast("Couldn't delete the comment", "error");
      }
    });
  };

  const comments = data?.comments ?? [];
  const roots = comments.filter((c) => !c.parentId);
  const childrenOf = (id: string) => comments.filter((c) => c.parentId === id);

  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight">
        <MessageSquare className="size-5 text-muted" /> Discussion
        {data && <span className="font-sans text-sm text-muted">({comments.length})</span>}
      </h2>

      {!data && !error && <div className="mt-4 h-24 animate-pulse rounded-2xl border bg-surface-2/40" />}
      {error && <p className="mt-4 text-sm text-muted">Comments are unavailable right now.</p>}

      {data && !data.viewer && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-surface-2/50 p-4">
          <p className="text-sm text-muted">Reading is free. To join the discussion, sign in with Google or create an account.</p>
          <Link href={loginHref} className="focus-ring inline-flex h-9 items-center gap-2 rounded-xl bg-foreground px-3.5 text-sm font-medium text-background">
            <LogIn className="size-4" /> Sign in to comment
          </Link>
        </div>
      )}

      {data?.viewer && (
        <div className="mt-4 rounded-2xl border bg-surface p-4">
          {replyTo && (
            <p className="mb-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted">
              <span>
                Replying to <strong>{replyTo.user.name ?? "reader"}</strong>
              </span>
              <button className="underline" onClick={() => setReplyTo(null)}>
                cancel
              </button>
            </p>
          )}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a thought, a question, or a correction…"
            className="min-h-24"
            maxLength={2000}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-2">
              Commenting as <strong className="text-muted">{data.viewer.name ?? "you"}</strong> · {content.length}/2000
            </span>
            <Button size="sm" onClick={submit} disabled={pending || content.trim().length < 2}>
              {pending && <Loader2 className="size-3.5 animate-spin" />} Post comment
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {data && roots.length === 0 && <li className="text-sm text-muted">No comments yet — be the first.</li>}
        {roots.map((c) => (
          <li key={c.id}>
            <CommentItem comment={c} viewer={data?.viewer ?? null} onReply={() => setReplyTo(c)} onDelete={() => remove(c.id)} />
            {childrenOf(c.id).length > 0 && (
              <ul className="mt-3 space-y-3 border-l pl-4 sm:ml-10">
                {childrenOf(c.id).map((r) => (
                  <li key={r.id}>
                    <CommentItem comment={r} viewer={data?.viewer ?? null} onDelete={() => remove(r.id)} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentItem({
  comment,
  viewer,
  onReply,
  onDelete,
}: {
  comment: CommentWithUser;
  viewer: Viewer;
  onReply?: () => void;
  onDelete: () => void;
}) {
  const canDelete = viewer && (viewer.id === comment.user.id || viewer.role === "admin");
  return (
    <article className="flex gap-3">
      {comment.user.image ? (
        <Image src={comment.user.image} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
          {initialsOf(comment.user.name)}
        </span>
      )}
      <div className="min-w-0 flex-1 rounded-2xl border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-foreground">{comment.user.name ?? "Reader"}</span>
          {comment.user.role === "admin" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-strong">
              <ShieldCheck className="size-3" /> Author
            </span>
          )}
          <span className="text-muted-2">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
        <div className="mt-2 flex items-center gap-3 text-xs">
          {onReply && viewer && (
            <button onClick={onReply} className="inline-flex items-center gap-1 text-muted hover:text-foreground">
              <Reply className="size-3.5" /> Reply
            </button>
          )}
          {canDelete && (
            <button onClick={onDelete} className="inline-flex items-center gap-1 text-muted hover:text-red-500">
              <Trash2 className="size-3.5" /> Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
