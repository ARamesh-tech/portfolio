import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin" | "user";
  }
  interface Session {
    user: {
      id: string;
      role: "admin" | "user";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "user";
  }
}
