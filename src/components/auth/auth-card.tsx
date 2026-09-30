import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { googleEnabled } from "@/auth";
import { googleSignIn } from "@/actions/auth";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  callbackUrl,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  callbackUrl: string;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-5 py-12 lg:min-h-screen">
      <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src={site.photo} alt="" width={56} height={56} className="size-14 rounded-full object-cover ring-2 ring-border" />
          <h1 className="mt-4 font-display text-3xl tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <div className="card p-6 sm:p-8">
          {googleEnabled && (
            <>
              <form action={googleSignIn}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <button
                  type="submit"
                  className="focus-ring flex h-11 w-full items-center justify-center gap-3 rounded-xl border bg-surface text-sm font-medium transition-colors hover:border-border-strong hover:bg-surface-2"
                >
                  <GoogleIcon /> Continue with Google
                </button>
              </form>
              <div className="my-5 flex items-center gap-3 text-[11px] tracking-wide text-muted-2 uppercase">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}
          {children}
        </div>
        <p className="mt-5 text-center text-sm text-muted">{footer}</p>
        <p className="mt-6 text-center text-xs text-muted-2">
          Signing in lets you comment and react on the blog. Reading is always free.{" "}
          <Link href="/blog" className="underline underline-offset-2 hover:text-foreground">
            Back to blog
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
