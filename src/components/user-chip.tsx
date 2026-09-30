"use client";

import { useTransition } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, BellRing, Loader2, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { subscribeMe, unsubscribeMe } from "@/actions/newsletter";
import { setNewsletterStatus, useNewsletterStatus } from "@/components/newsletter/newsletter-store";
import { toast } from "@/components/ui/toast";
import { initialsOf } from "@/lib/utils";

export function UserChip() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return <div className="h-12 animate-pulse rounded-2xl border bg-surface-2/60" aria-hidden />;
  }

  if (!session?.user) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
        className="focus-ring flex items-center justify-between rounded-2xl border bg-surface px-3 py-2.5 text-sm font-medium transition-colors hover:border-border-strong"
      >
        <span className="flex items-center gap-2">
          <LogIn className="size-4 text-muted" />
          Sign in
        </span>
        <span className="text-xs text-muted-2">to comment</span>
      </Link>
    );
  }

  const user = session.user;
  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-surface px-3 py-2.5">
      {user.image ? (
        <Image src={user.image} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
          {initialsOf(user.name ?? user.email)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
        <p className="truncate text-[11px] text-muted-2">{user.role === "admin" ? "Administrator" : "Reader"}</p>
      </div>
      <NewsletterBell email={user.email ?? null} />
      {user.role === "admin" && (
        <Link href="/admin" aria-label="Admin console" title="Admin console" className="focus-ring rounded-lg p-1.5 text-accent-strong hover:bg-accent-soft">
          <ShieldCheck className="size-4" />
        </Link>
      )}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="Sign out"
        title="Sign out"
        className="focus-ring rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-foreground"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

/** Blog subscription toggle: bell = subscribe, ringing bell = subscribed (click to unsubscribe). */
function NewsletterBell({ email }: { email: string | null }) {
  const sub = useNewsletterStatus(email);
  const [pending, startTransition] = useTransition();
  if (!email) return null;

  const toggle = () => {
    if (sub.subscribed && !confirm("Unsubscribe from new-post emails?")) return;
    startTransition(async () => {
      const res = sub.subscribed ? await unsubscribeMe() : await subscribeMe();
      if (res?.ok) {
        setNewsletterStatus({ subscribed: Boolean(res.subscribed), email });
        toast(res.message, "success");
      } else {
        toast(res?.message ?? "Something went wrong", "error");
      }
    });
  };

  const label = !sub.loaded ? "Blog subscription" : sub.subscribed ? "Subscribed to the blog — click to unsubscribe" : "Subscribe to new blog posts";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || !sub.loaded}
      aria-label={label}
      title={label}
      aria-pressed={sub.subscribed}
      className={`focus-ring rounded-lg p-1.5 transition-colors disabled:opacity-60 ${
        sub.subscribed ? "text-accent-strong hover:bg-accent-soft" : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : sub.subscribed ? <BellRing className="size-4" /> : <Bell className="size-4" />}
    </button>
  );
}
