"use client";

import { useEffect } from "react";
import type { AuthFormState } from "@/actions/auth";

/** Full-page navigation after a successful credentials sign-in so the client session refreshes. */
export function useAuthRedirect(state: AuthFormState) {
  useEffect(() => {
    if (state?.ok && state.redirectTo) window.location.assign(state.redirectTo);
  }, [state]);
}
