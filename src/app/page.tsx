import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, FileDown, Lightbulb, Mail, Sparkles } from "lucide-react";
import { site } from "@/lib/site";
import { featuredProjects } from "@/content/projects";
import { experience } from "@/content/experience";
import { getPublishedPosts } from "@/db/queries";
import { HeroBackground } from "@/components/hero-background";
import { Terminal } from "@/components/terminal";
import { GitHubActivity, GitHubActivitySkeleton } from "@/components/github-activity";
import { ProjectCard } from "@/components/project-card";
import { PostCard } from "@/components/post-card";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading, Container } from "@/components/ui/page-header";
import { SiteFooter } from "@/components/site-footer";
import { formatMonthYear } from "@/lib/utils";

export const revalidate = 300;

export default function HomePage() {
  const current = experience.find((e) => e.current)!;
  return (
    <>
      <section className="relative overflow-hidden">
        <HeroBackground />
        <Container className="pt-14 pb-10 sm:pt-20 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr]">
            <div className="animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border bg-surface/80 px-3 py-1 font-mono text-[11px] tracking-wide text-muted backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                {site.role} @ {site.company} · since {formatMonthYear(current.start)}
              </p>
              <h1 className="mt-6 font-display text-5xl leading-[0.98] tracking-tight text-balance sm:text-6xl lg:text-7xl">
                I build backends and data pipelines that{" "}
                <em className="text-accent-strong italic">earn trust</em>.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">
                {site.tagline} Currently at {site.company}, finishing an Integrated M.Tech at VIT Vellore, and writing about what
                I learn along the way.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <LinkButton href="/projects" size="lg">
                  View projects <ArrowRight className="size-4" />
                </LinkButton>
                <LinkButton href="/contact" variant="secondary" size="lg">
                  <Mail className="size-4" /> Get in touch
                </LinkButton>
                <LinkButton href="/resume" variant="ghost" size="lg">
                  <FileDown className="size-4" /> Résumé
                </LinkButton>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
                <li className="inline-flex items-center gap-2">
                  <Award className="size-4 text-warm" /> SIH 2025 Winner
                </li>
                <li className="inline-flex items-center gap-2">
                  <Lightbulb className="size-4 text-warm" /> Published patent co-inventor
                </li>
                <li className="inline-flex items-center gap-2">
                  <Sparkles className="size-4 text-warm" /> 25+ open-source repos
                </li>
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-sm animate-fade-up lg:max-w-none [animation-delay:120ms]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border bg-surface shadow-soft">
                <Image
                  src={site.photo}
                  alt={`Portrait of ${site.name}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 24rem, 30vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="absolute -top-4 -left-4 hidden rounded-2xl border bg-surface px-3 py-2 font-mono text-[11px] shadow-soft sm:block">
                <span className="text-muted">$</span> select * from <span className="text-accent-strong">ideas</span> where shipped = true;
              </div>
              <div className="absolute -right-3 -bottom-4 rounded-2xl border bg-surface px-4 py-2.5 shadow-soft">
                <p className="font-display text-lg leading-none tracking-tight">{site.name}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="pt-0">
        <SectionHeading
          eyebrow="Interactive"
          title="Prefer a shell? Talk to the site."
          description="A small terminal that knows my experience, skills and how to reach me. Type help to begin."
        />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Terminal />
          <Suspense fallback={<GitHubActivitySkeleton />}>
            <GitHubActivity />
          </Suspense>
        </div>
      </Container>

      <Container className="pt-0">
        <SectionHeading
          eyebrow="Selected work"
          title="Projects I'm proud of"
          description="Healthcare interoperability, adaptive security, embedded UIs and a few experiments."
          action={
            <Link href="/projects" className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-accent-strong hover:underline">
              All projects <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {featuredProjects.slice(0, 4).map((p) => (
            <ProjectCard key={p.slug} project={p} compact />
          ))}
        </div>
      </Container>

      <Container className="pt-0">
        <SectionHeading
          eyebrow="Writing"
          title="Latest from the blog"
          description="Notes on backend systems, data engineering, and things I learn on the job."
          action={
            <Link href="/blog" className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-accent-strong hover:underline">
              Read the blog <ArrowRight className="size-4" />
            </Link>
          }
        />
        <Suspense fallback={<div className="card h-48 animate-pulse bg-surface-2/40" />}>
          <LatestPosts />
        </Suspense>
      </Container>

      <Container className="pt-0">
        <div className="relative overflow-hidden rounded-3xl border bg-surface p-8 shadow-soft sm:p-12">
          <div className="absolute inset-0 -z-10 bg-dots opacity-60" />
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-accent-strong uppercase">Let&apos;s work together</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Have a data problem worth solving?</h2>
              <p className="mt-3 max-w-lg text-muted">
                I&apos;m open to interesting conversations about backend architecture, data platforms, and side projects. The
                fastest way to reach me is email.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <a href={`mailto:${site.email}`} className="focus-ring rounded-xl border bg-background px-4 py-2.5 font-medium hover:border-border-strong">
                {site.email}
              </a>
              <a href={site.phoneHref} className="focus-ring rounded-xl border bg-background px-4 py-2.5 font-medium hover:border-border-strong">
                {site.phone}
              </a>
            </div>
          </div>
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}

async function LatestPosts() {
  const posts = await getPublishedPosts({ limit: 3 });
  if (posts.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-muted">
        First posts are on their way. Subscribe on the <Link href="/blog" className="underline">blog</Link> to be notified.
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
