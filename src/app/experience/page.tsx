import type { Metadata } from "next";
import { Award, Briefcase, GraduationCap, Lightbulb, MapPin, ArrowUpRight } from "lucide-react";
import { experience, type ExperienceItem } from "@/content/experience";
import { Container, PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { formatMonthYear, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Work experience, achievements and education of A Ramesh Kumaran — Backend cum Data Engineer at Simpplr, SIH 2025 winner, XIBOTIX embedded systems intern, VIT Vellore.",
};

const kindMeta: Record<ExperienceItem["kind"], { icon: React.ComponentType<{ className?: string }>; label: string; tone: "accent" | "warm" | "neutral" }> = {
  work: { icon: Briefcase, label: "Work", tone: "accent" },
  achievement: { icon: Award, label: "Achievement", tone: "warm" },
  patent: { icon: Lightbulb, label: "Patent", tone: "warm" },
  education: { icon: GraduationCap, label: "Education", tone: "neutral" },
};

function duration(start: string, end: string | null) {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const months = Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1);
  if (months < 12) return `${months} mo${months > 1 ? "s" : ""}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y} yr${y > 1 ? "s" : ""}${m ? ` ${m} mo${m > 1 ? "s" : ""}` : ""}`;
}

export default function ExperiencePage() {
  return (
    <>
      <Container>
        <PageHeader
          eyebrow="Experience"
          title={
            <>
              From embedded C to <em className="text-accent-strong italic">production data pipelines</em>.
            </>
          }
          description="A timeline of the roles, wins and research that shaped how I build software. Currently a Backend cum Data Engineer at Simpplr."
        />

        <ol className="relative space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border sm:before:left-[19px]">
          {experience.map((item, i) => {
            const meta = kindMeta[item.kind];
            const Icon = meta.icon;
            return (
              <li key={item.id} className="relative pl-12 animate-fade-up sm:pl-16" style={{ animationDelay: `${i * 70}ms` }}>
                <span
                  className={cn(
                    "absolute top-1 left-0 flex size-8 items-center justify-center rounded-full border bg-surface shadow-sm sm:size-10",
                    item.current && "border-accent ring-4 ring-accent/15",
                  )}
                >
                  <Icon className={cn("size-4", item.kind === "work" ? "text-accent-strong" : item.kind === "education" ? "text-muted" : "text-warm")} />
                </span>
                <article className="card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        {item.current && (
                          <Badge tone="accent">
                            <span className="size-1.5 rounded-full bg-accent" /> Current
                          </Badge>
                        )}
                      </div>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight text-balance sm:text-xl">{item.title}</h2>
                      <p className="mt-0.5 text-sm text-muted">
                        {item.orgUrl ? (
                          <a href={item.orgUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-foreground hover:text-accent-strong">
                            {item.org} <ArrowUpRight className="size-3.5" />
                          </a>
                        ) : (
                          <span className="font-medium text-foreground">{item.org}</span>
                        )}
                        {item.location && (
                          <span className="ml-2 inline-flex items-center gap-1 text-muted-2">
                            <MapPin className="size-3" /> {item.location}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right font-mono text-xs text-muted">
                      <div>
                        {formatMonthYear(item.start)} — {item.end && item.end !== item.start ? formatMonthYear(item.end) : item.end ? "" : "Present"}
                      </div>
                      {item.kind === "work" || item.kind === "education" ? <div className="text-muted-2">{duration(item.start, item.end)}</div> : null}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted text-pretty">{item.summary}</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {item.highlights.map((h) => (
                      <li key={h} className="flex gap-2.5 leading-relaxed">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  {item.tech && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.tech.map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </Container>
      <SiteFooter />
    </>
  );
}
