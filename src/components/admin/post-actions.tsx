"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { deletePost, togglePublish } from "@/actions/admin";
import { toast } from "@/components/ui/toast";

export function PostRowActions({ id, published, title }: { id: string; published: boolean; title: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={pending}
        title={published ? "Unpublish" : "Publish"}
        onClick={() =>
          start(async () => {
            try {
              await togglePublish(id);
              toast(published ? "Post unpublished" : "Post published");
              router.refresh();
            } catch {
              toast("Couldn't update the post", "error");
            }
          })
        }
        className="focus-ring rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      <button
        type="button"
        disabled={pending}
        title="Delete"
        onClick={() => {
          if (!confirm(`Delete "${title}"? This also removes its comments and reactions.`)) return;
          start(async () => {
            try {
              await deletePost(id);
              toast("Post deleted");
              router.refresh();
            } catch {
              toast("Couldn't delete the post", "error");
            }
          });
        }}
        className="focus-ring rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
