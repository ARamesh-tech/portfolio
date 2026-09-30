"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { withDb } from "@/db/safe";
import { contactMessages } from "@/db/schema";
import { contactNotificationEmail } from "@/lib/email-templates";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { site } from "@/lib/site";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell me your name").max(80),
  subject: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10, "A little more detail helps me reply well").max(4000),
  website: z.string().max(0).optional(), // honeypot
});

export type ContactState = { ok: boolean; message: string; errors?: Record<string, string>; requiresLogin?: boolean } | null;

const recent = new Map<string, number[]>();
function rateLimited(key: string, limit = 5, windowMs = 10 * 60_000) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > limit;
}

async function notifyOwner(data: { name: string; email: string; subject: string; message: string }) {
  if (!isMailConfigured()) return false;
  const mail = contactNotificationEmail(data);
  const res = await sendMail({ to: process.env.CONTACT_TO_EMAIL ?? site.email, replyTo: data.email, ...mail });
  return res.ok;
}

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Only signed-in visitors can write — the sender email is always the verified account email.
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, requiresLogin: true, message: "Please sign in to send a message." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? session.user.name ?? "",
    subject: formData.get("subject") ?? "",
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(`${session.user.id}:${ip}`)) {
    return { ok: false, message: "Too many messages in a short time. Please try again later." };
  }

  const data = { ...parsed.data, email: session.user.email, userId: session.user.id };

  try {
    await withDb(async () => {
      await db().insert(contactMessages).values({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        userId: data.userId,
      });
    });
  } catch (err) {
    console.error("[contact] failed to store message:", err);
    // Still attempt email delivery so the message isn't lost.
    const delivered = await notifyOwner(data);
    if (!delivered) {
      return { ok: false, message: `Something went wrong saving your message. Please email me directly at ${site.email}.` };
    }
    return { ok: true, message: "Thanks! Your message is on its way. I'll reply soon." };
  }

  await notifyOwner(data);
  return { ok: true, message: "Thanks! Your message has been received. I usually reply within a day or two." };
}
