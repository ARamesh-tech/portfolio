import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" && sp.callbackUrl.startsWith("/") ? sp.callbackUrl : "/blog";

  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <AuthShell
      title="Join the conversation"
      subtitle="Create a free account to comment and react."
      callbackUrl={callbackUrl}
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-accent-strong hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
