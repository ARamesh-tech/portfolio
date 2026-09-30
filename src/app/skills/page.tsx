import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { skillGroups, learningNow } from "@/content/skills";
import { Container, PageHeader } from "@/components/ui/page-header";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Skills",
  description: "Languages, backend frameworks, data engineering tools, ML libraries and embedded platforms A Ramesh Kumaran works with.",
};

const levelLabel = ["", "Familiar", "Comfortable", "Proficient", "Strong", "Expert"];

export default function SkillsPage() {
  return (
    <>
      <Container>
        <PageHeader
          eyebrow="Skills"
          title={
            <>
              A toolbox shaped by <em className="text-accent-strong italic">real problems</em>.
            </>
          }
          description="Honest self-assessment: five bars means I could teach it, two means I'm actively learning. I'd rather show range and depth than a wall of logos."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {skillGroups.map((group, gi) => (
            <section key={group.id} className="card p-5 animate-fade-up sm:p-6" style={{ animationDelay: `${gi * 60}ms` }} aria-labelledby={`skills-${group.id}`}>
              <h2 id={`skills-${group.id}`} className="font-display text-2xl tracking-tight">
                {group.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{group.blurb}</p>
              <ul className="mt-5 space-y-3">
                {group.skills.map((s) => (
                  <li key={s.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">
                        {s.name}
                        {s.note && <span className="ml-2 text-xs font-normal text-muted-2">— {s.note}</span>}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-2">{levelLabel[s.level]}</span>
                    </div>
                    <div className="mt-1.5 flex gap-1" role="img" aria-label={`${s.name}: ${levelLabel[s.level]}`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={cn("h-1.5 flex-1 rounded-full transition-colors", n <= s.level ? "bg-accent" : "bg-surface-2")}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-3xl border bg-surface p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-warm" />
            <h2 className="font-display text-2xl tracking-tight">Currently levelling up</h2>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {learningNow.map((item) => (
              <li key={item} className="flex items-center gap-2.5 rounded-xl border bg-surface-2/50 px-3.5 py-2.5 text-sm">
                <span className="size-1.5 rounded-full bg-warm" /> {item}
              </li>
            ))}
          </ul>
        </section>
      </Container>
      <SiteFooter />
    </>
  );
}
