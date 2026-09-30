import { site } from "@/lib/site";

/**
 * Outbound email with two interchangeable providers:
 *  - SMTP    (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — Gmail with an App Password is the
 *             default setup for this site; no custom domain required)
 *  - Resend  (RESEND_API_KEY + MAIL_FROM on a domain verified in Resend)
 * SMTP wins when both are configured, because a Resend key without a verified domain can only
 * deliver to the account owner. When neither is configured, sends are skipped and logged.
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

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function mailProvider(): MailProvider {
  if (isSmtpConfigured()) return "smtp";
  if (process.env.RESEND_API_KEY) return "resend";
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

/**
 * Resend accounts without a verified domain can only send from onboarding@resend.dev, and
 * only to the account owner's own address. Everything else is rejected with a 403.
 */
export function isResendSandbox() {
  return mailProvider() === "resend" && /@resend\.dev>?$/i.test(mailFrom().trim());
}

type ResendPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

async function sendViaResend(messages: MailMessage[]): Promise<MailResult[]> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = mailFrom();

  const toPayload = (m: MailMessage): ResendPayload => ({
    from,
    to: m.to,
    subject: m.subject,
    html: m.html,
    text: m.text,
    ...(m.replyTo ? { replyTo: m.replyTo } : {}),
    ...(m.headers ? { headers: m.headers } : {}),
  });

  const sendOne = async (p: ResendPayload): Promise<MailResult> => {
    try {
      const res = await resend.emails.send(p);
      return res.error ? { ok: false, error: res.error.message } : { ok: true, id: res.data?.id };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const results: MailResult[] = [];
  // Resend's batch endpoint accepts up to 100 messages per call.
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map(toPayload);
    if (chunk.length === 1) {
      results.push(await sendOne(chunk[0]!));
      continue;
    }
    try {
      const res = await resend.batch.send(chunk);
      if (!res.error) {
        results.push(...chunk.map(() => ({ ok: true as const })));
        continue;
      }
      console.warn(`[mail] resend batch rejected (${res.error.message}); retrying ${chunk.length} message(s) individually.`);
    } catch (err) {
      console.warn(`[mail] resend batch threw (${err instanceof Error ? err.message : String(err)}); retrying individually.`);
    }
    // A batch is all-or-nothing, so one rejected recipient would otherwise block everyone else.
    for (const p of chunk) results.push(await sendOne(p));
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
    // Gmail app passwords are shown with spaces ("abcd efgh ijkl mnop"); tolerate a pasted copy.
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS?.replace(/\s+/g, "") },
    pool: true,
    maxConnections: 3,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
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
    console.warn(`[mail] skipped ${messages.length} email(s) — SMTP_HOST/SMTP_USER/SMTP_PASS (or RESEND_API_KEY) not configured.`);
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
