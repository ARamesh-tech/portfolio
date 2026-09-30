"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { resubscribeByToken, unsubscribeByToken, type NewsletterState } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";

export function UnsubscribeForm({ token, initiallyActive }: { token: string; initiallyActive: boolean }) {
  const [unsubState, unsubAction, unsubPending] = useActionState<NewsletterState, FormData>(unsubscribeByToken, null);
  const [resubState, resubAction, resubPending] = useActionState<NewsletterState, FormData>(resubscribeByToken, null);

  // Latest successful action wins; otherwise fall back to the server-rendered state.
  const latest = [unsubState, resubState].filter((s): s is NonNullable<NewsletterState> => Boolean(s?.ok)).at(-1);
  const active = latest ? Boolean(latest.subscribed) : initiallyActive;
  const error = [unsubState, resubState].find((s) => s && !s.ok)?.message;

  return (
    <div className="space-y-3">
      {latest && <p className="rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-strong">{latest.message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {active ? (
        <form action={unsubAction}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="danger" disabled={unsubPending}>
            {unsubPending && <Loader2 className="size-4 animate-spin" />} Yes, unsubscribe me
          </Button>
        </form>
      ) : (
        <form action={resubAction}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="secondary" disabled={resubPending}>
            {resubPending && <Loader2 className="size-4 animate-spin" />} Subscribe again
          </Button>
        </form>
      )}
    </div>
  );
}
