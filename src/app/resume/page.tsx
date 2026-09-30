import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/lib/site";
import { experience } from "@/content/experience";
import { projects } from "@/content/projects";
import { skillGroups } from "@/content/skills";
import { PrintButton } from "@/components/print-button";
import { formatMonthYear } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Résumé",
  description: `Printable résumé of ${site.name} — ${site.role} at ${site.company}.`,
};

export default function ResumePage() {
  const work = experience.filter((e) => e.kind === "work");
  const education = experience.filter((e) => e.kind === "education");
  const honours = experience.filter((e) => e.kind === "achievement" || e.kind === "patent");
  const topProjects = projects.filter((p) => p.featured).slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="no-print mb-6 flex items-center justify-between gap-3 rounded-2xl border bg-surface px-4 py-3 text-sm">
        <p className="text-muted">Optimised for A4. Use print → &ldquo;Save as PDF&rdquo;.</p>
        <PrintButton />
      </div>

      <article className="card p-8 sm:p-10 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
          <div>
            <h1 className="font-display text-4xl tracking-tight">{site.name}</h1>
            <p className="mt-1 text-lg text-muted">
              {site.role} · {site.company}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-foreground">
                  {site.email}
                </a>
              </li>
              <li>
                <a href={site.phoneHref} className="hover:text-foreground">
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={site.socials.github} className="hover:text-foreground">
                  github.com/{site.githubUser}
                </a>
              </li>
              <li>
                <a href={site.socials.linkedin} className="hover:text-foreground">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
          <Image src={site.photo} alt="" width={88} height={88} className="size-22 rounded-2xl object-cover object-top ring-1 ring-border" />
        </header>

        <Section title="Summary">
          <p className="text-sm leading-relaxed text-muted">
            Backend & Data Engineer building services and pipelines at Simpplr. Integrated M.Tech CSE student at VIT Vellore (2022–2027). Smart India
            Hackathon 2025 winner (Ministry of Ayush) and co-inventor on a published indoor-positioning patent. Comfortable across Python, SQL,
            Node.js, PostgreSQL, embedded Linux and applied ML.
          </p>
        </Section>

        <Section title="Experience">
          {work.map((w) => (
            <Entry key={w.id} title={w.title} org={w.org} meta={`${formatMonthYear(w.start)} — ${w.end ? formatMonthYear(w.end) : "Present"}`}>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted">
                {w.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </Entry>
          ))}
        </Section>

        <Section title="Honours & Research">
          {honours.map((h) => (
            <Entry key={h.id} title={h.title} org={h.org} meta={formatMonthYear(h.start)}>
              <p className="mt-1 text-sm text-muted">{h.summary}</p>
            </Entry>
          ))}
        </Section>

        <Section title="Selected Projects">
          {topProjects.map((p) => (
            <Entry key={p.slug} title={p.title} org={p.tech.slice(0, 5).join(" · ")} meta={String(p.year)}>
              <p className="mt-1 text-sm text-muted">{p.tagline}</p>
            </Entry>
          ))}
        </Section>

        <Section title="Skills">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {skillGroups.map((g) => (
              <div key={g.id}>
                <dt className="font-medium">{g.title}</dt>
                <dd className="text-muted">{g.skills.filter((s) => s.level >= 3).map((s) => s.name).join(", ")}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Education">
          {education.map((e) => (
            <Entry key={e.id} title={e.title} org={e.org} meta={`${formatMonthYear(e.start)} — ${formatMonthYear(e.end)}`}>
              <p className="mt-1 text-sm text-muted">{e.summary}</p>
            </Entry>
          ))}
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid">
      <h2 className="mb-3 font-mono text-[11px] tracking-[0.2em] text-accent-strong uppercase">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Entry({ title, org, meta, children }: { title: string; org: string; meta: string; children?: React.ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        <span className="font-mono text-xs text-muted-2">{meta}</span>
      </div>
      <p className="text-sm text-muted">{org}</p>
      {children}
    </div>
  );
}
