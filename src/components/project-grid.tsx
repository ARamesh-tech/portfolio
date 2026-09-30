"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { projects, projectCategories, type ProjectCategory } from "@/content/projects";
import { ProjectCard } from "./project-card";
import { cn } from "@/lib/utils";

export function ProjectGrid() {
  const [category, setCategory] = useState<ProjectCategory | "All">("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects
      .filter((p) => category === "All" || p.category === category)
      .filter(
        (p) =>
          !needle ||
          p.title.toLowerCase().includes(needle) ||
          p.tagline.toLowerCase().includes(needle) ||
          p.tech.some((t) => t.toLowerCase().includes(needle)),
      )
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.year - a.year);
  }, [category, q]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by category">
          {(["All", ...projectCategories] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === c ? "border-foreground bg-foreground text-background" : "bg-surface text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {c}
              <span className={cn("ml-1.5 font-mono text-[10px]", category === c ? "text-background/70" : "text-muted-2")}>
                {c === "All" ? projects.length : counts.get(c) ?? 0}
              </span>
            </button>
          ))}
        </div>
        <label className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tech or title…"
            className="focus-ring w-full rounded-xl border bg-surface py-2 pr-3 pl-9 text-sm placeholder:text-muted-2"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="card p-10 text-center text-sm text-muted">No projects match that filter.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p, i) => (
            <div key={p.slug} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
