"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Mail, MailOpen, Trash2 } from "lucide-react";
import { deleteMessage, markMessageRead } from "@/actions/admin";
import { toast } from "@/components/ui/toast";

export function MessageActions({ id, read, email, subject }: { id: string; read: boolean; email: string; subject: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const cls = "focus-ring inline-flex items-center gap-1 rounded-lg border bg-surface px-2 py-1 text-xs text-muted hover:border-border-strong hover:text-foreground disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <a href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${subject || "your message"}`)}`} className={cls}>
        <Mail className="size-3.5" /> Reply
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await markMessageRead(id, !read);
            router.refresh();
          })
        }
        className={cls}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : read ? <MailOpen className="size-3.5" /> : <Check className="size-3.5" />}
        {read ? "Mark unread" : "Mark read"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this message?")) return;
          start(async () => {
            await deleteMessage(id);
            toast("Message deleted");
            router.refresh();
          });
        }}
        className={`${cls} hover:text-red-500`}
      >
        <Trash2 className="size-3.5" /> Delete
      </button>
    </div>
  );
}
