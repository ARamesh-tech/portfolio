"use client";

import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { registerAction, type AuthFormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useAuthRedirect } from "./use-auth-redirect";

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerAction, null);
  useAuthRedirect(state);
  const busy = pending || Boolean(state?.ok && state.redirectTo);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Name" htmlFor="name">
        <Input id="name" name="name" autoComplete="name" placeholder="Your name" required />
        {state?.errors?.name && <p className="mt-1 text-xs text-red-500">{state.errors.name}</p>}
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        {state?.errors?.email && <p className="mt-1 text-xs text-red-500">{state.errors.email}</p>}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" hint="At least 8 characters">
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
          {state?.errors?.password && <p className="mt-1 text-xs text-red-500">{state.errors.password}</p>}
        </Field>
        <Field label="Confirm" htmlFor="confirm">
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
          {state?.errors?.confirm && <p className="mt-1 text-xs text-red-500">{state.errors.confirm}</p>}
        </Field>
      </div>
      {state && !state.ok && !state.errors && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      {state?.ok && <p className="rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent-strong">{state.message}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Create account
      </Button>
    </form>
  );
}
