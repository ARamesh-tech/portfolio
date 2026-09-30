import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const errorMessages: Record<string, string> = {
  CredentialsSignin: "Incorrect email or password.",
  AccessDenied: "You need an administrator account to open that page.",
  OAuthAccountNotLinked: "This email is already registered with a password. Sign in with your password instead.",
  Configuration: "Sign-in is temporarily misconfigured. Please try again later.",
  Default: "Something went wrong while signing in.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" && sp.callbackUrl.startsWith("/") ? sp.callbackUrl : "/blog";
  const error = typeof sp.error === "string" ? errorMessages[sp.error] ?? errorMessages.Default : undefined;

  const session = await auth();
  if (session?.user && !error) redirect(callbackUrl);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to comment and react on the blog."
      callbackUrl={callbackUrl}
      footer={
        <>
          New here?{" "}
          <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-accent-strong hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={callbackUrl} initialError={error} />
    </AuthShell>
  );
}
