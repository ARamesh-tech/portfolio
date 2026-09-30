"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "./ui/toast";
import { cn } from "@/lib/utils";

export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label ?? text}`}
      title="Copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast(`${label ?? "Text"} copied`);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          toast("Couldn't copy", "error");
        }
      }}
      className={cn("focus-ring rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground", className)}
    >
      {copied ? <Check className="size-4 text-accent-strong" /> : <Copy className="size-4" />}
    </button>
  );
}
