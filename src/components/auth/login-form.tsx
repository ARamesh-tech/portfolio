"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAction, type AuthFormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useAuthRedirect } from "./use-auth-redirect";

export function LoginForm({ callbackUrl, initialError }: { callbackUrl: string; initialError?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginAction, null);
  useAuthRedirect(state);
  const message = state?.message ?? initialError;
  const busy = pending || Boolean(state?.ok && state.redirectTo);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        {state?.errors?.email && <p className="mt-1 text-xs text-red-500">{state.errors.email}</p>}
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        {state?.errors?.password && <p className="mt-1 text-xs text-red-500">{state.errors.password}</p>}
      </Field>
      {message && !state?.ok && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        {state?.ok && state.redirectTo ? "Signed in…" : "Sign in"}
      </Button>
    </form>
  );
}
