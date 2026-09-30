"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Mail, Command } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { nav, site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { NavIcon } from "./nav-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserChip } from "@/components/user-chip";
import { openCommandPalette } from "@/components/command-palette";

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className={cn("flex flex-col gap-1", className)}>
      {nav.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent-soft text-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <NavIcon
              name={item.icon}
              className={cn("size-4 shrink-0 transition-colors", active ? "text-accent-strong" : "text-muted-2 group-hover:text-foreground")}
            />
            <span className="flex-1">{item.label}</span>
            <kbd className="hidden rounded-md border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-2 lg:inline-block">
              {item.shortcut}
            </kbd>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r bg-surface/80 backdrop-blur-xl lg:flex">
      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
        <Link href="/" className="focus-ring group flex items-center gap-3 rounded-2xl">
          <span className="relative">
            <Image
              src={site.photo}
              alt={site.name}
              width={48}
              height={48}
              priority
              className="size-12 rounded-full border-2 border-surface object-cover shadow-sm ring-1 ring-border"
            />
            <span
              aria-hidden
              className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface bg-accent"
              title="Open to conversations"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">{site.name}</span>
            <span className="block truncate text-xs text-muted">
              {site.role} · {site.company}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={openCommandPalette}
          className="focus-ring mt-6 flex items-center gap-2 rounded-xl border bg-surface-2/60 px-3 py-2 text-left text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground"
        >
          <Command className="size-3.5" />
          <span className="flex-1">Search or jump to…</span>
          <kbd className="rounded-md border bg-surface px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>

        <NavLinks className="mt-5" />

        <div className="mt-auto pt-6">
          <div className="mb-4 rounded-2xl border bg-surface-2/50 p-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-2 uppercase">Get in touch</p>
            <a
              href={`mailto:${site.email}`}
              className="focus-ring mt-1 block truncate rounded text-sm font-medium text-foreground hover:text-accent-strong"
            >
              {site.email}
            </a>
            <div className="mt-2 flex items-center gap-1.5">
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
          </div>
          <UserChip />
        </div>
      </div>
    </aside>
  );
}

export function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className="focus-ring rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      {children}
    </a>
  );
}
