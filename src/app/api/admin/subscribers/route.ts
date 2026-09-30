import { auth } from "@/auth";
import { db } from "@/db";
import { safeQuery } from "@/db/safe";
import { subscribers } from "@/db/schema";

function csvCell(value: string | null | undefined) {
  const v = value ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") return new Response("Forbidden", { status: 403 });
  const rows = await safeQuery(() => db().select().from(subscribers).orderBy(subscribers.createdAt), []);
  const header = "email,status,subscribed_at,welcomed_at,unsubscribed_at,linked_account";
  const lines = rows.map((r) =>
    [
      csvCell(r.email),
      r.active ? "active" : "unsubscribed",
      r.createdAt.toISOString(),
      r.welcomedAt?.toISOString() ?? "",
      r.unsubscribedAt?.toISOString() ?? "",
      r.userId ? "yes" : "no",
    ].join(","),
  );
  return new Response([header, ...lines].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="subscribers.csv"' },
  });
}
