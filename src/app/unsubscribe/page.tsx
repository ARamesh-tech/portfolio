import type { Metadata } from "next";
import Link from "next/link";
import { MailX } from "lucide-react";
import { safeQuery } from "@/db/safe";
import { getSubscriptionByToken } from "@/lib/newsletter";
import { Container } from "@/components/ui/page-header";
import { UnsubscribeForm } from "@/components/newsletter/unsubscribe-form";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const subscription = token ? await safeQuery(() => getSubscriptionByToken(token), null) : null;

  return (
    <Container className="max-w-xl">
      <div className="card p-8 sm:p-10">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <MailX className="size-6" />
        </span>
        {subscription ? (
          <>
            <h1 className="mt-5 font-display text-3xl">{subscription.active ? "Unsubscribe from the blog?" : "You're unsubscribed"}</h1>
            <p className="mt-2 text-sm text-muted">
              {subscription.active ? (
                <>
                  <span className="font-medium text-foreground">{subscription.email}</span> will stop receiving new-post emails from {site.name}. You can always
                  come back.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{subscription.email}</span> no longer receives new-post emails. Changed your mind?
                </>
              )}
            </p>
            <div className="mt-6">
              <UnsubscribeForm token={token} initiallyActive={subscription.active} />
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-display text-3xl">This link isn&apos;t valid</h1>
            <p className="mt-2 text-sm text-muted">
              The unsubscribe link is missing or has expired. If you&apos;re signed in, you can manage your subscription from the bell icon in the sidebar, or
              just email me at{" "}
              <a className="underline" href={`mailto:${site.email}`}>
                {site.email}
              </a>
              .
            </p>
          </>
        )}
        <p className="mt-8 text-xs text-muted-2">
          <Link href="/blog" className="underline hover:text-foreground">
            Back to the blog
          </Link>
        </p>
      </div>
    </Container>
  );
}
