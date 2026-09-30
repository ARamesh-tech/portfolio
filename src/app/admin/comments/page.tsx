import Link from "next/link";
import { getRecentCommentsAdmin } from "@/db/queries";
import { timeAgo } from "@/lib/utils";
import { CommentDelete } from "@/components/admin/comment-delete";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const rows = await getRecentCommentsAdmin();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Recent comments</h2>
      <ul className="card divide-y">
        {rows.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">
                <span className="font-medium text-foreground">{c.userName ?? "Reader"}</span> <span className="text-muted-2">({c.userEmail})</span> on{" "}
                <Link href={`/blog/${c.postSlug}#discussion`} className="underline underline-offset-2 hover:text-foreground">
                  {c.postTitle}
                </Link>{" "}
                · {timeAgo(c.createdAt)}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
            </div>
            <CommentDelete id={c.id} />
          </li>
        ))}
        {rows.length === 0 && <li className="p-10 text-center text-sm text-muted">No comments yet.</li>}
      </ul>
    </div>
  );
}
