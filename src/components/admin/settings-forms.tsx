"use client";

import { useActionState, useEffect } from "react";
import { Loader2, KeyRound, UserCog } from "lucide-react";
import { changePassword, updateProfile, type SettingsState } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(changePassword, null);
  useEffect(() => {
    if (state) toast(state.message, state.ok ? "success" : "error");
  }, [state]);
  return (
    <form action={action} className="card space-y-4 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <KeyRound className="size-4 text-muted" /> {hasPassword ? "Change password" : "Set a password"}
      </h2>
      {hasPassword && (
        <Field label="Current password" htmlFor="current">
          <Input id="current" name="current" type="password" autoComplete="current-password" />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="password" hint="At least 10 characters">
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm" htmlFor="confirm">
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </Field>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} Update password
      </Button>
    </form>
  );
}

export function ProfileForm({ name, image }: { name: string; image: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfile, null);
  useEffect(() => {
    if (state) toast(state.message, state.ok ? "success" : "error");
  }, [state]);
  return (
    <form action={action} className="card space-y-4 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <UserCog className="size-4 text-muted" /> Public profile
      </h2>
      <Field label="Display name" htmlFor="name" hint="Shown as the author on posts and comments.">
        <Input id="name" name="name" defaultValue={name} required />
      </Field>
      <Field label="Avatar URL" htmlFor="image" hint="Leave blank to use the site photo.">
        <Input id="image" name="image" defaultValue={image} placeholder="https://…" />
      </Field>
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} Save profile
      </Button>
    </form>
  );
}
