import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { site } from "@/lib/site";
import { aboutIntro, quickFacts, values, interests, now, timeline } from "@/content/about";
import { Container, PageHeader, SectionHeading } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "About me",
  description: "Who A Ramesh Kumaran is — Backend & Data Engineer at Simpplr, VIT Vellore student, SIH 2025 winner, and how he thinks about building software.",
};

export default function AboutPage() {
  return (
    <>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <PageHeader
              eyebrow="About me"
              title={
                <>
                  Curious by default, <em className="text-accent-strong italic">rigorous</em> by habit.
                </>
              }
            />
            <div className="space-y-5 text-base leading-relaxed text-muted text-pretty">
              {aboutIntro.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>

            <SectionHeading className="mt-14" eyebrow="How I work" title="A few things I believe" />
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <div key={v.title} className="card p-5">
                  <h3 className="font-semibold tracking-tight">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{v.body}</p>
                </div>
              ))}
            </div>

            <SectionHeading className="mt-14" eyebrow="Timeline" title="The short version" />
            <ol className="space-y-3 border-l pl-6">
              {timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full border-2 border-surface bg-accent" />
                  <span className="font-mono text-xs text-accent-strong">{t.year}</span>
                  <p className="text-sm text-muted">{t.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <aside className="space-y-5 lg:pt-8">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border shadow-soft">
              <Image src={site.photo} alt={site.name} fill sizes="320px" className="object-cover object-top" />
            </div>
            <dl className="card divide-y">
              {quickFacts.map((f) => (
                <div key={f.label} className="flex flex-col px-4 py-3">
                  <dt className="text-[11px] font-medium tracking-wide text-muted-2 uppercase">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Now</h3>
                <span className="font-mono text-[10px] text-muted-2">updated {now.updated}</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {now.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" /> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-4">
              <h3 className="text-sm font-semibold">Interests</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {interests.map((i) => (
                  <Badge key={i}>{i}</Badge>
                ))}
              </div>
            </div>
            <LinkButton href="/contact" className="w-full">
              <Mail className="size-4" /> Say hello
            </LinkButton>
            <Link href="/resume" className="focus-ring flex items-center justify-center gap-1 rounded text-sm text-muted hover:text-foreground">
              View résumé <ArrowRight className="size-4" />
            </Link>
          </aside>
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
