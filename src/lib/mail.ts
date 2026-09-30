import { site } from "@/lib/site";

/**
 * Outbound email with two interchangeable providers:
 *  - Resend  (RESEND_API_KEY, optional MAIL_FROM on a verified domain)
 *  - SMTP    (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — e.g. Gmail with an App Password)
 * When neither is configured, sends are skipped and logged so the site keeps working.
 */

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type MailResult = { ok: true; id?: string } | { ok: false; skipped?: boolean; error?: string };

export type MailProvider = "resend" | "smtp" | null;

export function mailProvider(): MailProvider {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  return null;
}

export function isMailConfigured() {
  return mailProvider() !== null;
}

export function mailFrom() {
  if (process.env.MAIL_FROM) return process.env.MAIL_FROM;
  if (process.env.CONTACT_FROM_EMAIL) return process.env.CONTACT_FROM_EMAIL;
  if (mailProvider() === "smtp") return `${site.name} <${process.env.SMTP_USER}>`;
  return `${site.name} <onboarding@resend.dev>`;
}

async function sendViaResend(messages: MailMessage[]): Promise<MailResult[]> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = mailFrom();
  const results: MailResult[] = [];
  // Resend's batch endpoint accepts up to 100 messages per call.
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const payload = chunk.map((m) => ({
      from,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      ...(m.replyTo ? { replyTo: m.replyTo } : {}),
      ...(m.headers ? { headers: m.headers } : {}),
    }));
    try {
      const res = chunk.length === 1 ? await resend.emails.send(payload[0]!) : await resend.batch.send(payload);
      if (res.error) {
        results.push(...chunk.map(() => ({ ok: false as const, error: res.error?.message })));
      } else {
        results.push(...chunk.map(() => ({ ok: true as const })));
      }
    } catch (err) {
      results.push(...chunk.map(() => ({ ok: false as const, error: err instanceof Error ? err.message : String(err) })));
    }
  }
  return results;
}

async function sendViaSmtp(messages: MailMessage[]): Promise<MailResult[]> {
  const nodemailer = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections: 3,
  });
  const from = mailFrom();
  const results: MailResult[] = [];
  for (const m of messages) {
    try {
      const info = await transport.sendMail({
        from,
        to: m.to,
        subject: m.subject,
        html: m.html,
        text: m.text,
        replyTo: m.replyTo,
        headers: m.headers,
      });
      results.push({ ok: true, id: info.messageId });
    } catch (err) {
      results.push({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }
  transport.close();
  return results;
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  const [result] = await sendMany([message]);
  return result ?? { ok: false, error: "No result" };
}

export async function sendMany(messages: MailMessage[]): Promise<MailResult[]> {
  if (messages.length === 0) return [];
  const provider = mailProvider();
  if (!provider) {
    console.warn(`[mail] skipped ${messages.length} email(s) — no RESEND_API_KEY or SMTP_* configured.`);
    return messages.map(() => ({ ok: false, skipped: true }));
  }
  try {
    const results = provider === "resend" ? await sendViaResend(messages) : await sendViaSmtp(messages);
    const failed = results.filter((r) => !r.ok);
    if (failed.length) console.error(`[mail] ${failed.length}/${messages.length} email(s) failed via ${provider}:`, failed[0]);
    return results;
  } catch (err) {
    console.error("[mail] delivery failed:", err);
    return messages.map(() => ({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  }
}
