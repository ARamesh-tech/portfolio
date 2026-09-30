"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { site } from "@/lib/site";
import { NavLinks, SocialLink } from "./sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserChip } from "@/components/user-chip";

export function MobileNav() {
  const pathname = usePathname();
  // The drawer remembers which route it was opened on, so a navigation closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (next: boolean | ((v: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(open) : next;
    setOpenedAt(value ? pathname : null);
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedAt(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-xl">
          <Image src={site.photo} alt={site.name} width={36} height={36} className="size-9 rounded-full object-cover ring-1 ring-border" />
          <span className="text-sm font-semibold tracking-tight">{site.name}</span>
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="focus-ring rounded-xl border bg-surface p-2 text-foreground"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col border-r bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-muted-2 uppercase">Navigate</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="focus-ring rounded-lg p-1.5 text-muted">
                <X className="size-4" />
              </button>
            </div>
            <NavLinks className="mt-3" onNavigate={() => setOpen(false)} />
            <div className="mt-auto space-y-3 pt-6">
              <div className="flex items-center gap-1.5">
                <SocialLink href={site.socials.github} label="GitHub">
                  <GithubIcon className="size-4" />
                </SocialLink>
                <SocialLink href={site.socials.linkedin} label="LinkedIn">
                  <LinkedinIcon className="size-4" />
                </SocialLink>
                <SocialLink href={`mailto:${site.email}`} label="Email">
                  <Mail className="size-4" />
                </SocialLink>
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </div>
              <UserChip />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
