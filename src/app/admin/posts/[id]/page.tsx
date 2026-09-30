import { notFound } from "next/navigation";
import { getPostByIdAdmin } from "@/db/queries";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params, searchParams }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const post = await getPostByIdAdmin(id);
  if (!post) notFound();
  return (
    <div className="space-y-4">
      {sp.created && (
        <p className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-2.5 text-sm text-accent-strong">
          Post created. You can keep editing here.
        </p>
      )}
      <PostEditor post={post} />
    </div>
  );
}
