import { getContactMessages } from "@/db/queries";
import { formatDate, cn } from "@/lib/utils";
import { MessageActions } from "@/components/admin/message-actions";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();
  const unread = messages.filter((m) => !m.read).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Inbox</h2>
        <p className="text-sm text-muted">
          {messages.length} message{messages.length === 1 ? "" : "s"} · {unread} unread
        </p>
      </div>
      <ul className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className={cn("card p-5", !m.read && "border-accent/40")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {!m.read && <span className="size-2 rounded-full bg-accent" aria-label="Unread" />}
                  {m.name}
                  <a href={`mailto:${m.email}`} className="text-sm font-normal text-muted hover:text-foreground">
                    {m.email}
                  </a>
                </p>
                {m.subject && <p className="mt-0.5 text-sm text-muted">Subject: {m.subject}</p>}
              </div>
              <time className="font-mono text-xs text-muted-2">{formatDate(m.createdAt, { dateStyle: "medium", timeStyle: "short" })}</time>
            </div>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
            <div className="mt-4">
              <MessageActions id={m.id} read={m.read} email={m.email} subject={m.subject} />
            </div>
          </li>
        ))}
        {messages.length === 0 && <li className="card p-10 text-center text-sm text-muted">No messages yet. Share your contact page and they&apos;ll show up here.</li>}
      </ul>
    </div>
  );
}
