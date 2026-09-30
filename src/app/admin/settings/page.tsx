import { eq } from "drizzle-orm";
import { auth, googleEnabled } from "@/auth";
import { db } from "@/db";
import { getDbHealth } from "@/db/health";
import { safeQuery } from "@/db/safe";
import { users } from "@/db/schema";
import { isResendSandbox, mailFrom, mailProvider } from "@/lib/mail";
import { PasswordForm, ProfileForm } from "@/components/admin/settings-forms";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  const user = session?.user;
  const row = user?.id
    ? await safeQuery(async () => {
        const [r] = await db().select({ name: users.name, image: users.image, hash: users.passwordHash, email: users.email }).from(users).where(eq(users.id, user.id)).limit(1);
        return r ?? null;
      }, null)
    : null;

  const dbHealth = await getDbHealth();
  const env = [
    {
      key: "DATABASE_URL",
      ok: dbHealth.ok,
      note: dbHealth.ok ? `Aiven PostgreSQL — connected (${dbHealth.latencyMs} ms)` : dbHealth.error ?? "Aiven PostgreSQL",
    },
    { key: "AUTH_SECRET", ok: Boolean(process.env.AUTH_SECRET), note: "Session signing" },
    { key: "AUTH_GOOGLE_ID / SECRET", ok: googleEnabled, note: "Google sign-in button" },
    {
      key: "SMTP_HOST / SMTP_USER / SMTP_PASS",
      ok: mailProvider() !== null && !isResendSandbox(),
      note: !mailProvider()
        ? "Email delivery (contact alerts, newsletter) — currently logged only. Set SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER and a Gmail App Password as SMTP_PASS."
        : isResendSandbox()
          ? `Resend is in TEST MODE: sending from ${mailFrom()} only delivers to ${process.env.CONTACT_TO_EMAIL ?? "your own Resend account email"}. Other subscribers get nothing. Configure Gmail SMTP (SMTP_HOST / SMTP_USER / SMTP_PASS) — it takes precedence — or verify a domain at resend.com/domains.`
          : `Email via ${mailProvider() === "smtp" ? `SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587})` : "Resend"} from ${mailFrom()} — contact alerts, welcome + new-post emails`,
    },
    {
      key: "MAIL_FROM",
      ok: Boolean(process.env.MAIL_FROM) || mailProvider() === "smtp",
      note: process.env.MAIL_FROM
        ? `Sender: ${process.env.MAIL_FROM}`
        : mailProvider() === "smtp"
          ? `Not set — sending as ${mailFrom()} (Gmail rewrites the From address to the account anyway)`
          : "Not set — sender falls back to the provider default (with Resend that means test mode)",
    },
    { key: "NEXT_PUBLIC_SITE_URL", ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL), note: "Canonical URLs, OG images, email links" },
    { key: "GITHUB_TOKEN", ok: Boolean(process.env.GITHUB_TOKEN), note: "Optional — higher GitHub API limits" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <ProfileForm name={row?.name ?? user?.name ?? ""} image={row?.image ?? ""} />
        <PasswordForm hasPassword={Boolean(row?.hash)} />
      </div>
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="text-sm font-semibold">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="font-medium">{row?.email ?? user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Role</dt>
              <dd>
                <Badge tone="accent">admin</Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Password login</dt>
              <dd>{row?.hash ? "Enabled" : "Not set"}</dd>
            </div>
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-semibold">Environment health</h2>
          <p className="mt-1 text-xs text-muted">Values are never displayed — only whether they are set.</p>
          <ul className="mt-3 divide-y">
            {env.map((e) => (
              <li key={e.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="font-mono text-xs">{e.key}</p>
                  <p className="text-xs text-muted-2">{e.note}</p>
                </div>
                <Badge tone={e.ok ? "accent" : "neutral"}>{e.ok ? "set" : "missing"}</Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
