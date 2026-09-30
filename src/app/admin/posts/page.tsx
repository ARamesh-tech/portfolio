import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { getAllPostsAdmin } from "@/db/queries";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { PostRowActions } from "@/components/admin/post-actions";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await getAllPostsAdmin();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">All posts ({posts.length})</h2>
        <LinkButton href="/admin/posts/new" size="sm">
          <Plus className="size-4" /> New post
        </LinkButton>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60 text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Status</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Views</th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Comments</th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Updated</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-surface-2/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-accent-strong">
                    {p.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-2">/blog/{p.slug}</p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <div className="flex gap-1">
                    <Badge tone={p.published ? "accent" : "neutral"}>{p.published ? "Live" : "Draft"}</Badge>
                    {p.featured && <Badge tone="warm">Featured</Badge>}
                  </div>
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs md:table-cell">{p.views}</td>
                <td className="hidden px-4 py-3 font-mono text-xs lg:table-cell">{p.commentCount}</td>
                <td className="hidden px-4 py-3 text-xs text-muted lg:table-cell">{formatDate(p.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/posts/${p.id}`} title="Edit" className="focus-ring rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground">
                      <Pencil className="size-4" />
                    </Link>
                    {p.published && (
                      <Link href={`/blog/${p.slug}`} target="_blank" title="View" className="focus-ring rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground">
                        <ExternalLink className="size-4" />
                      </Link>
                    )}
                    <PostRowActions id={p.id} published={p.published} title={p.title} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No posts yet. Start with your first draft.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
