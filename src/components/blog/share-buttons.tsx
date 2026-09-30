"use client";

import { Link2, Share2, MessageCircle, Check } from "lucide-react";
import { LinkedinIcon } from "@/components/icons";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function ShareButtons({ url, title, className, compact = false }: { url: string; title: string; className?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Couldn't copy link", "error");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url, title });
      } catch {
        /* user cancelled */
      }
    } else {
      await copy();
    }
  };

  const btn = "focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border bg-surface px-3 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {!compact && <span className="mr-1 text-xs font-medium text-muted-2 uppercase tracking-wide">Share</span>}
      <button type="button" onClick={copy} className={btn} aria-label="Copy link">
        {copied ? <Check className="size-3.5 text-accent-strong" /> : <Link2 className="size-3.5" />} {compact ? null : "Copy link"}
      </button>
      <a href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`} target="_blank" rel="noreferrer" className={btn} aria-label="Share on X">
        <XIcon /> {compact ? null : "X"}
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`} target="_blank" rel="noreferrer" className={btn} aria-label="Share on LinkedIn">
        <LinkedinIcon className="size-3.5" /> {compact ? null : "LinkedIn"}
      </a>
      <a href={`https://wa.me/?text=${text}%20${encoded}`} target="_blank" rel="noreferrer" className={btn} aria-label="Share on WhatsApp">
        <MessageCircle className="size-3.5" /> {compact ? null : "WhatsApp"}
      </a>
      <button type="button" onClick={nativeShare} className={btn} aria-label="More sharing options">
        <Share2 className="size-3.5" /> {compact ? null : "More"}
      </button>
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
