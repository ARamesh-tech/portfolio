"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  Copy,
  FileDown,
  Mail,
  Moon,
  Phone,
  Search,
  Sun,
  Terminal,
} from "lucide-react";
import { nav, site } from "@/lib/site";
import { projects } from "@/content/projects";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { NavIcon } from "./layout/nav-icon";
import { toast } from "./ui/toast";

const OPEN_EVENT = "portfolio:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (typing || open || e.metaKey || e.ctrlKey || e.altKey) return;
      const item = nav.find((n) => n.shortcut === e.key);
      if (item) {
        e.preventDefault();
        router.push(item.href);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, [open, router]);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied to clipboard`);
    } catch {
      toast("Couldn't copy — please copy manually", "error");
    }
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      overlayClassName="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      contentClassName="fixed top-[15vh] left-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border bg-surface shadow-2xl animate-fade-up"
    >
      <div className="flex items-center gap-2 border-b px-4">
        <Search className="size-4 text-muted" />
        <Command.Input
          placeholder="Type a command or search…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
        />
        <kbd className="rounded-md border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">esc</kbd>
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-muted">No results.</Command.Empty>

        <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-2 [&_[cmdk-group-heading]]:uppercase">
          {nav.map((item) => (
            <Item key={item.href} onSelect={() => run(() => router.push(item.href))} shortcut={item.shortcut}>
              <NavIcon name={item.icon} className="size-4 text-muted" />
              {item.label}
            </Item>
          ))}
          <Item onSelect={() => run(() => router.push("/resume"))}>
            <FileDown className="size-4 text-muted" />
            Résumé
          </Item>
        </Command.Group>

        <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-2 [&_[cmdk-group-heading]]:uppercase">
          <Item onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
            {resolvedTheme === "dark" ? <Sun className="size-4 text-muted" /> : <Moon className="size-4 text-muted" />}
            Toggle theme
          </Item>
          <Item onSelect={() => run(() => copy(site.email, "Email"))}>
            <Copy className="size-4 text-muted" />
            Copy email address
          </Item>
          <Item onSelect={() => run(() => copy(site.phone, "Phone number"))}>
            <Phone className="size-4 text-muted" />
            Copy phone number
          </Item>
          <Item onSelect={() => run(() => router.push("/#terminal"))}>
            <Terminal className="size-4 text-muted" />
            Open the terminal
          </Item>
        </Command.Group>

        <Command.Group heading="Links" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-2 [&_[cmdk-group-heading]]:uppercase">
          <Item onSelect={() => run(() => window.open(site.socials.github, "_blank"))}>
            <GithubIcon className="size-4 text-muted" />
            GitHub
          </Item>
          <Item onSelect={() => run(() => window.open(site.socials.linkedin, "_blank"))}>
            <LinkedinIcon className="size-4 text-muted" />
            LinkedIn
          </Item>
          <Item onSelect={() => run(() => window.location.assign(`mailto:${site.email}`))}>
            <Mail className="size-4 text-muted" />
            Send an email
          </Item>
        </Command.Group>

        <Command.Group heading="Projects" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-2 [&_[cmdk-group-heading]]:uppercase">
          {projects.slice(0, 8).map((p) => (
            <Item key={p.slug} onSelect={() => run(() => router.push(`/projects#${p.slug}`))} keywords={p.tech}>
              <ArrowRight className="size-4 text-muted" />
              {p.title}
            </Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

function Item({
  children,
  onSelect,
  shortcut,
  keywords,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  shortcut?: string;
  keywords?: string[];
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      keywords={keywords}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground data-[selected=true]:bg-accent-soft"
    >
      {children}
      {shortcut && (
        <kbd className="ml-auto rounded-md border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">{shortcut}</kbd>
      )}
    </Command.Item>
  );
}
