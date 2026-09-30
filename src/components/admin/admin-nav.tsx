"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Inbox, MessageSquare, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/messages", label: "Inbox", icon: Inbox },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-2xl border bg-surface p-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "focus-ring inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "bg-foreground text-background" : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" /> {item.label}
          </Link>
        );
      })}
      <Link href="/admin/posts/new" className="focus-ring ml-1 inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
        <Plus className="size-3.5" /> New post
      </Link>
    </div>
  );
}
