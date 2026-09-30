"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: ToastKind };

const EVENT = "portfolio:toast";
let counter = 0;

export function toast(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT, { detail: { id: ++counter, message, kind } }));
}

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const item = (e as CustomEvent<ToastItem>).detail;
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== item.id)), 3800);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border bg-surface px-3.5 py-2.5 text-sm shadow-lg animate-fade-up",
              t.kind === "error" && "border-red-500/40",
              t.kind === "success" && "border-accent/40",
            )}
          >
            <Icon className={cn("size-4 shrink-0", t.kind === "error" ? "text-red-500" : t.kind === "success" ? "text-accent-strong" : "text-muted")} />
            <span className="flex-1">{t.message}</span>
            <button
              aria-label="Dismiss"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              className="rounded-md p-1 text-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
