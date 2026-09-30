"use client";

import { useEffect, useSyncExternalStore } from "react";

export type NewsletterStatus = { loaded: boolean; subscribed: boolean; email?: string };

let state: NewsletterStatus = { loaded: false, subscribed: false };
let loadedFor: string | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const serverSnapshot: NewsletterStatus = { loaded: false, subscribed: false };

function emit() {
  for (const l of listeners) l();
}

function subscribeStore(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setNewsletterStatus(next: Partial<NewsletterStatus>) {
  state = { ...state, ...next, loaded: true };
  emit();
}

export function loadNewsletterStatus(viewerKey: string, force = false) {
  if (!force && loadedFor === viewerKey && state.loaded) return;
  if (inflight) return;
  loadedFor = viewerKey;
  inflight = fetch("/api/newsletter/status", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { subscribed: boolean; email?: string }) => {
      state = { loaded: true, subscribed: Boolean(d.subscribed), email: d.email };
      emit();
    })
    .catch(() => {
      state = { loaded: true, subscribed: false };
      emit();
    })
    .finally(() => {
      inflight = null;
    });
}

/**
 * Subscription status for the signed-in viewer, shared between the sidebar chip and
 * newsletter cards so they stay in sync without a global provider.
 */
export function useNewsletterStatus(viewerKey: string | null) {
  const snapshot = useSyncExternalStore(subscribeStore, () => state, () => serverSnapshot);
  useEffect(() => {
    if (viewerKey) loadNewsletterStatus(viewerKey);
  }, [viewerKey]);
  return viewerKey ? snapshot : serverSnapshot;
}

/* Session-scoped dismissal flag (banner), also via an external store to avoid setState-in-effect. */
const dismissListeners = new Set<() => void>();
export function dismissFlag(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {}
  for (const l of dismissListeners) l();
}
export function useDismissed(key: string) {
  return useSyncExternalStore(
    (cb) => {
      dismissListeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        dismissListeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => {
      try {
        return sessionStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
}
