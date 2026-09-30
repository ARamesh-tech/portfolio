import type { NextAuthConfig } from "next-auth";

/**
 * Edge/proxy-safe part of the Auth.js config (no database imports).
 * The full config with providers + adapter lives in `auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        return auth?.user?.role === "admin";
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
        token.picture = user.image ?? token.picture;
        token.name = user.name ?? token.name;
      }
      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if (typeof session.image === "string") token.picture = session.image;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.role = (token.role as "admin" | "user") ?? "user";
      if (typeof token.picture === "string") session.user.image = token.picture;
      if (typeof token.name === "string") session.user.name = token.name;
      return session;
    },
  },
} satisfies NextAuthConfig;
