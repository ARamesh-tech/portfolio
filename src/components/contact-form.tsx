"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send, Loader2, CheckCircle2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { submitContact, type ContactState } from "@/actions/contact";
import { Button } from "./ui/button";
import { Field, Input, Textarea } from "./ui/field";
import { toast } from "./ui/toast";

export function ContactForm() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="card h-[26rem] animate-pulse bg-surface-2/40" aria-hidden />;
  }

  if (!session?.user) {
    return <SignInGate />;
  }

  return <MessageForm key={session.user.email ?? "user"} name={session.user.name ?? ""} email={session.user.email ?? ""} />;
}

function SignInGate() {
  const callback = encodeURIComponent("/contact");
  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center animate-fade-up">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <ShieldCheck className="size-6" />
      </span>
      <div>
        <h3 className="font-display text-2xl">Sign in to send a message</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          To keep the inbox spam-free, the contact form is open to signed-in visitors only. It takes a few seconds with Google or an email
          and password, and your message arrives with a verified reply address.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href={`/login?callbackUrl=${callback}`} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90">
          <LogIn className="size-4" /> Sign in
        </Link>
        <Link href={`/register?callbackUrl=${callback}`} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-4 text-sm font-medium hover:border-border-strong">
          <UserPlus className="size-4" /> Create account
        </Link>
      </div>
      <p className="text-xs text-muted-2">Prefer not to sign in? Email or call me using the details on the right.</p>
    </div>
  );
}

function MessageForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      toast(state.message);
    } else if (state && !state.ok && !state.errors) {
      toast(state.message, "error");
    }
  }, [state]);

  if (state?.ok) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center animate-fade-up">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <CheckCircle2 className="size-6" />
        </span>
        <h3 className="font-display text-2xl">Message received</h3>
        <p className="max-w-sm text-sm text-muted">{state.message}</p>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="card space-y-4 p-6 sm:p-8" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name">
          <Input id="name" name="name" defaultValue={name} placeholder="Ada Lovelace" required autoComplete="name" aria-invalid={Boolean(state?.errors?.name)} />
          {state?.errors?.name && <p className="mt-1 text-xs text-red-500">{state.errors.name}</p>}
        </Field>
        <Field label="Email" htmlFor="email" hint="From your signed-in account">
          <Input id="email" name="email" type="email" value={email} readOnly className="cursor-not-allowed bg-surface-2/60 text-muted" />
        </Field>
      </div>
      <Field label="Subject" htmlFor="subject" hint="Optional — what's this about?">
        <Input id="subject" name="subject" placeholder="Collaboration, a question, a job…" />
      </Field>
      <Field label="Message" htmlFor="message">
        <Textarea id="message" name="message" placeholder="Tell me what you're working on and how I can help." required aria-invalid={Boolean(state?.errors?.message)} />
        {state?.errors?.message && <p className="mt-1 text-xs text-red-500">{state.errors.message}</p>}
      </Field>
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-2">Your message is stored securely and delivered to my inbox.</p>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
