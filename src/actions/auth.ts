"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn, adminEmail } from "@/auth";
import { db } from "@/db";
import { withDb } from "@/db/safe";
import { users } from "@/db/schema";

/**
 * On success `redirectTo` is set and the client performs a full-page navigation. A hard reload
 * (rather than a server-side redirect) makes `useSession()` pick up the new cookie immediately.
 */
export type AuthFormState = { ok: boolean; message: string; errors?: Record<string, string>; redirectTo?: string } | null;

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name").max(80),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

function safeCallback(url: unknown) {
  const s = typeof url === "string" ? url : "/";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

function zodErrors(err: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: zodErrors(parsed.error) };

  const email = parsed.data.email.toLowerCase();
  try {
    await withDb(async () => {
      const [existing] = await db()
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(sql`lower(${users.email}) = ${email}`)
        .limit(1);
      const hash = await bcrypt.hash(parsed.data.password, 12);
      if (existing) {
        if (existing.passwordHash) throw new Error("EXISTS");
        // Account created via Google earlier — attach a password so both methods work.
        await db().update(users).set({ passwordHash: hash, name: parsed.data.name }).where(sql`${users.id} = ${existing.id}`);
      } else {
        await db().insert(users).values({
          name: parsed.data.name,
          email,
          passwordHash: hash,
          role: email === adminEmail ? "admin" : "user",
          emailVerified: null,
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "EXISTS") {
      return { ok: false, message: "An account with this email already exists. Try signing in.", errors: { email: "Already registered" } };
    }
    return { ok: false, message: "Registration is unavailable right now. Please try again shortly." };
  }

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirect: false });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { ok: true, message: "Account created. You can sign in now.", redirectTo: `/login?callbackUrl=${encodeURIComponent(safeCallback(formData.get("callbackUrl")))}` };
  }
  return { ok: true, message: "Account created. Redirecting…", redirectTo: safeCallback(formData.get("callbackUrl")) };
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: zodErrors(parsed.error) };

  try {
    await signIn("credentials", { email: parsed.data.email.toLowerCase(), password: parsed.data.password, redirect: false });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") return { ok: false, message: "Incorrect email or password." };
      return { ok: false, message: "Sign-in failed. Please try again." };
    }
    return { ok: false, message: "Sign-in is unavailable right now. Please try again shortly." };
  }
  return { ok: true, message: "Signed in. Redirecting…", redirectTo: safeCallback(formData.get("callbackUrl")) };
}

export async function googleSignIn(formData: FormData) {
  await signIn("google", { redirectTo: safeCallback(formData.get("callbackUrl")) });
}
