"use server";

import { z } from "zod";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { withDb } from "@/db/safe";
import { isDbConfigured } from "@/db";
import { deactivateSubscription, getSubscription, getSubscriptionByToken, reactivateByToken, sendWelcomeEmail, upsertSubscription } from "@/lib/newsletter";

export type NewsletterState = { ok: boolean; message: string; subscribed?: boolean } | null;

const emailSchema = z.string().trim().toLowerCase().email();

function scheduleWelcome(email: string, name?: string | null) {
  after(async () => {
    try {
      await sendWelcomeEmail(email, name);
    } catch (err) {
      console.error("[newsletter] welcome email failed:", err);
    }
  });
}

/** Guest subscription from the email form. Signed-in users are subscribed with their account email. */
export async function subscribe(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const session = await auth();
  const raw = session?.user?.email ?? formData.get("email");
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please enter a valid email." };
  if (!isDbConfigured()) return { ok: false, message: "Subscriptions aren't available yet. Please try again later." };
  try {
    const { needsWelcome } = await withDb(() => upsertSubscription({ email: parsed.data, userId: session?.user?.id ?? null }));
    if (needsWelcome) scheduleWelcome(parsed.data, session?.user?.name);
    revalidatePath("/admin");
    return { ok: true, subscribed: true, message: "You're on the list. New posts will land in your inbox." };
  } catch (err) {
    console.error("[newsletter] subscribe failed:", err);
    return { ok: false, message: "Couldn't subscribe right now. Please try again later." };
  }
}

/** One-click subscribe for the signed-in viewer. */
export async function subscribeMe(): Promise<NewsletterState> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, message: "Please sign in first." };
  try {
    const { needsWelcome } = await withDb(() => upsertSubscription({ email, userId: session.user.id }));
    if (needsWelcome) scheduleWelcome(email, session.user.name);
    revalidatePath("/admin");
    return { ok: true, subscribed: true, message: `Subscribed as ${email}. Check your inbox for a welcome note.` };
  } catch (err) {
    console.error("[newsletter] subscribeMe failed:", err);
    return { ok: false, message: "Couldn't subscribe right now. Please try again later." };
  }
}

/** One-click unsubscribe for the signed-in viewer. */
export async function unsubscribeMe(): Promise<NewsletterState> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, message: "Please sign in first." };
  try {
    await withDb(() => deactivateSubscription({ email }));
    revalidatePath("/admin");
    return { ok: true, subscribed: false, message: "You've been unsubscribed. No more emails from me." };
  } catch {
    return { ok: false, message: "Couldn't unsubscribe right now. Please try again later." };
  }
}

export async function mySubscriptionStatus(): Promise<{ signedIn: boolean; email?: string; subscribed: boolean }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { signedIn: false, subscribed: false };
  if (!isDbConfigured()) return { signedIn: true, email, subscribed: false };
  try {
    const sub = await withDb(() => getSubscription(email));
    return { signedIn: true, email, subscribed: Boolean(sub?.active) };
  } catch {
    return { signedIn: true, email, subscribed: false };
  }
}

/** Used by the /unsubscribe page (link in every email). */
export async function unsubscribeByToken(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, message: "This unsubscribe link is invalid." };
  try {
    const row = await withDb(() => deactivateSubscription({ token }));
    if (!row) return { ok: false, message: "This unsubscribe link is invalid or already used." };
    revalidatePath("/admin");
    return { ok: true, subscribed: false, message: `${row.email} has been unsubscribed.` };
  } catch {
    return { ok: false, message: "Couldn't unsubscribe right now. Please try again later." };
  }
}

export async function resubscribeByToken(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { ok: false, message: "This link is invalid." };
  try {
    const existing = await withDb(() => getSubscriptionByToken(token));
    if (!existing) return { ok: false, message: "This link is invalid." };
    await withDb(() => reactivateByToken(token));
    revalidatePath("/admin");
    return { ok: true, subscribed: true, message: `${existing.email} is subscribed again.` };
  } catch {
    return { ok: false, message: "Couldn't update your subscription right now." };
  }
}
