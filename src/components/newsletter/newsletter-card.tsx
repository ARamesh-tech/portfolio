"use client";

import { useActionState, useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BellRing, Check, Loader2, Mail, X } from "lucide-react";
import { subscribe, subscribeMe, unsubscribeMe, type NewsletterState } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { dismissFlag, setNewsletterStatus, useDismissed, useNewsletterStatus } from "./newsletter-store";

type Variant = "card" | "banner";

const BANNER_KEY = "newsletter-banner-dismissed";

export function NewsletterCard({ variant = "card", className }: { variant?: Variant; className?: string }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const viewerKey = session?.user?.email ?? null;
  const sub = useNewsletterStatus(viewerKey);
  const dismissed = useDismissed(BANNER_KEY);
  const [pending, startTransition] = useTransition();

  if (status === "loading") {
    return variant === "banner" ? null : <div className={cn("h-28 animate-pulse rounded-2xl border bg-surface-2/40", className)} aria-hidden />;
  }

  // Guests: classic email form (banner variant is only for signed-in readers).
  if (!session?.user) {
    if (variant === "banner") return null;
    return (
      <div className={cn("rounded-2xl border bg-surface p-4", className)}>
        <p className="text-sm font-semibold">Get new posts by email</p>
        <p className="mt-1 text-xs text-muted">No spam. Unsubscribe whenever.</p>
        <div className="mt-3">
          <GuestForm />
        </div>
        <p className="mt-3 text-[11px] text-muted-2">
          Or{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} className="underline hover:text-foreground">
            sign in
          </Link>{" "}
          for one-click subscribe.
        </p>
      </div>
    );
  }

  const email = session.user.email ?? "";
  const firstName = session.user.name?.split(" ")[0];

  const toggle = (next: boolean) => {
    if (!next && !confirm("Unsubscribe from new-post emails?")) return;
    startTransition(async () => {
      const res = next ? await subscribeMe() : await unsubscribeMe();
      if (res?.ok) {
        setNewsletterStatus({ subscribed: Boolean(res.subscribed), email });
        toast(res.message, "success");
      } else {
        toast(res?.message ?? "Something went wrong", "error");
      }
    });
  };

  if (variant === "banner") {
    if (!sub.loaded || sub.subscribed || dismissed) return null;
    return (
      <div className={cn("relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent-soft/60 p-4 pr-12 animate-fade-up", className)}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-accent-strong">
            <BellRing className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{firstName ? `${firstName}, want new posts by email?` : "Want new posts by email?"}</p>
            <p className="text-xs text-muted">
              One click — I&apos;ll send a short welcome note to <span className="font-medium text-foreground">{email}</span>, then only new posts.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => toggle(true)} disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />} Subscribe
        </Button>
        <button
          type="button"
          onClick={() => dismissFlag(BANNER_KEY)}
          aria-label="Dismiss"
          className="focus-ring absolute top-3 right-3 rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border bg-surface p-4", className)}>
      {!sub.loaded ? (
        <div className="h-16 animate-pulse rounded-xl bg-surface-2/60" aria-hidden />
      ) : sub.subscribed ? (
        <>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <Check className="size-4 text-accent-strong" /> You&apos;re subscribed
          </p>
          <p className="mt-1 truncate text-xs text-muted">New posts go to {email}.</p>
          <Button variant="ghost" size="sm" className="mt-3 -ml-2 text-muted" onClick={() => toggle(false)} disabled={pending}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Unsubscribe
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold">Get new posts by email</p>
          <p className="mt-1 truncate text-xs text-muted">Subscribe as {email}. Unsubscribe anytime.</p>
          <Button size="sm" className="mt-3 w-full" onClick={() => toggle(true)} disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />} Subscribe
          </Button>
        </>
      )}
    </div>
  );
}

function GuestForm() {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribe, null);

  useEffect(() => {
    if (state) toast(state.message, state.ok ? "success" : "error");
  }, [state]);

  if (state?.ok) {
    return <p className="rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent-strong">{state.message}</p>;
  }

  return (
    <form action={action} className="flex gap-2">
      <Input name="email" type="email" required placeholder="you@example.com" aria-label="Email address" className="flex-1 text-xs" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending} aria-label="Subscribe">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
      </Button>
    </form>
  );
}