"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { adminDeleteComment } from "@/actions/admin";
import { toast } from "@/components/ui/toast";

export function CommentDelete({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this comment (and its replies)?")) return;
        start(async () => {
          await adminDeleteComment(id);
          toast("Comment removed");
          router.refresh();
        });
      }}
      className="focus-ring inline-flex items-center gap-1 rounded-lg border bg-surface px-2 py-1 text-xs text-muted hover:border-border-strong hover:text-red-500 disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Delete
    </button>
  );
}
