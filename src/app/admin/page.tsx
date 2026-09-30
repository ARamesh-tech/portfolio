import Link from "next/link";
import { ArrowRight, Eye, FileText, Inbox, MessageSquare, Users, Mail } from "lucide-react";
import { getAdminStats, getAllPostsAdmin, getContactMessages } from "@/db/queries";
import { isDbConfigured } from "@/db";
import { formatDate, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [stats, posts, messages] = await Promise.all([getAdminStats(), getAllPostsAdmin(), getContactMessages()]);

  return (
    <div className="space-y-8">
      {!isDbConfigured() && (
        <div className="rounded-2xl border border-warm/40 bg-warm-soft p-4 text-sm">
          <strong>Database not configured.</strong> Set <code className="font-mono">DATABASE_URL</code> in your environment to enable posts, comments and messages.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<FileText className="size-4" />} label="Posts" value={stats.posts} sub={`${stats.published} published`} href="/admin/posts" />
        <Stat icon={<Eye className="size-4" />} label="Total views" value={stats.views} sub="across all posts" />
        <Stat icon={<MessageSquare className="size-4" />} label="Comments" value={stats.comments} sub={`${stats.users} registered readers`} href="/admin/comments" />
        <Stat icon={<Inbox className="size-4" />} label="Messages" value={stats.messages} sub={stats.unread ? `${stats.unread} unread` : "all read"} href="/admin/messages" highlight={stats.unread > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent posts</h2>
            <Link href="/admin/posts" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
              Manage <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="mt-3 divide-y">
            {posts.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <Link href={`/admin/posts/${p.id}`} className="block truncate font-medium hover:text-accent-strong">
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-2">
                    {p.published ? `Published ${formatDate(p.publishedAt)}` : "Draft"} · {p.views} views · {p.commentCount} comments
                  </p>
                </div>
                <Badge tone={p.published ? "accent" : "neutral"}>{p.published ? "Live" : "Draft"}</Badge>
              </li>
            ))}
            {posts.length === 0 && (
              <li className="py-6 text-center text-sm text-muted">
                No posts yet.{" "}
                <Link href="/admin/posts/new" className="underline">
                  Write your first
                </Link>
                .
              </li>
            )}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Latest messages</h2>
            <Link href="/admin/messages" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
              Inbox <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="mt-3 divide-y">
            {messages.slice(0, 6).map((m) => (
              <li key={m.id} className="py-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-medium">
                    {!m.read && <span className="mr-1.5 inline-block size-1.5 rounded-full bg-accent align-middle" />}
                    {m.name} <span className="font-normal text-muted-2">· {m.email}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-2">{timeAgo(m.createdAt)}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted">{m.subject || m.message}</p>
              </li>
            ))}
            {messages.length === 0 && <li className="py-6 text-center text-sm text-muted">No messages yet.</li>}
          </ul>
        </section>
      </div>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
            <Users className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{stats.subscribers} active subscriber{stats.subscribers === 1 ? "" : "s"}</p>
            <p className="text-xs text-muted">They get a welcome email once, then one email per newly published post.</p>
          </div>
        </div>
        <a href="/api/admin/subscribers" className="focus-ring inline-flex items-center gap-1.5 rounded-xl border bg-surface px-3 py-1.5 text-xs font-medium hover:border-border-strong">
          <Mail className="size-3.5" /> Export CSV
        </a>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, sub, href, highlight }: { icon: React.ReactNode; label: string; value: number; sub: string; href?: string; highlight?: boolean }) {
  const inner = (
    <>
      <div className="flex items-center justify-between text-muted">
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
        <span className={highlight ? "text-accent-strong" : ""}>{icon}</span>
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-muted-2">{sub}</p>
    </>
  );
  const cls = "card block p-4 transition-colors hover:border-border-strong";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
