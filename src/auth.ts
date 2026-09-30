import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db, isDbConfigured } from "./db";
import { accounts, sessions, users, verificationTokens } from "./db/schema";
import { ensureSchema } from "./db/bootstrap";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminEmail = (process.env.ADMIN_EMAIL ?? "rameshkumarana@gmail.com").toLowerCase();

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

function buildAdapter() {
  if (!isDbConfigured()) return undefined;
  return DrizzleAdapter(db(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: buildAdapter(),
  providers: [
    ...(googleEnabled
      ? [
          Google({
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success || !isDbConfigured()) return null;
        await ensureSchema();
        const email = parsed.data.email.toLowerCase().trim();
        const [user] = await db()
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);
        if (!user) return null;

        let ok = false;
        if (user.passwordHash) {
          ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        } else if (email === adminEmail && process.env.ADMIN_PASSWORD) {
          // First-time admin login before a hash exists: accept the env password and persist a hash.
          ok = parsed.data.password === process.env.ADMIN_PASSWORD;
          if (ok) {
            await db()
              .update(users)
              .set({ passwordHash: await bcrypt.hash(parsed.data.password, 12), role: "admin" })
              .where(eq(users.id, user.id));
          }
        }
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: email === adminEmail ? "admin" : user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!isDbConfigured()) return false;
      await ensureSchema();
      // Promote the site owner to admin whenever they sign in with the configured email.
      if (account?.provider !== "credentials" && user.email?.toLowerCase() === adminEmail) {
        user.role = "admin";
      }
      return true;
    },
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      // OAuth users are created by the adapter with the default role — sync the admin flag.
      if (params.user && params.user.email?.toLowerCase() === adminEmail) {
        token.role = "admin";
        if (params.user.id && isDbConfigured()) {
          await db().update(users).set({ role: "admin" }).where(eq(users.id, params.user.id)).catch(() => {});
        }
      } else if (params.user && !params.user.role && params.user.id && isDbConfigured()) {
        const [row] = await db().select({ role: users.role }).from(users).where(eq(users.id, params.user.id)).limit(1);
        token.role = row?.role ?? "user";
      }
      return token;
    },
  },
});
