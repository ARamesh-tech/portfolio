import { ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import type { Project } from "@/content/projects";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

export function ProjectCard({ project, className, compact = false }: { project: Project; className?: string; compact?: boolean }) {
  return (
    <article
      id={project.slug}
      className={cn(
        "card group relative flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-wide text-muted-2 uppercase">
            {project.category} · {project.year}
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-balance">
            {project.repo ? (
              <a href={project.repo} target="_blank" rel="noreferrer" className="focus-ring rounded after:absolute after:inset-0">
                {project.title}
              </a>
            ) : (
              project.title
            )}
          </h3>
        </div>
        {project.highlight && (
          <Badge tone="warm" className="shrink-0">
            {project.highlight}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm font-medium text-muted">{project.tagline}</p>
      {!compact && <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">{project.description}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tech.slice(0, compact ? 4 : 6).map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>
      <div className="relative z-10 mt-4 flex items-center gap-3 pt-3 text-xs font-medium">
        {project.repo && (
          <a href={project.repo} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1 rounded text-muted hover:text-foreground">
            <GithubIcon className="size-3.5" /> Source
          </a>
        )}
        {project.live && (
          <a href={project.live} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1 rounded text-accent-strong hover:underline">
            Live <ArrowUpRight className="size-3.5" />
          </a>
        )}
        <span className="ml-auto text-muted-2 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </article>
  );
}
