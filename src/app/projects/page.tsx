import type { Metadata } from "next";
import { GithubIcon } from "@/components/icons";
import { site } from "@/lib/site";
import { projects } from "@/content/projects";
import { Container, PageHeader } from "@/components/ui/page-header";
import { ProjectGrid } from "@/components/project-grid";
import { LinkButton } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Projects",
  description: `${projects.length} projects across backend & data, AI/ML, embedded systems, web and blockchain — including the SIH 2025 winning NAMASTE → ICD-11 terminology service.`,
};

export default function ProjectsPage() {
  return (
    <>
      <Container size="wide">
        <PageHeader
          eyebrow="Projects"
          title={
            <>
              Things I&apos;ve <em className="text-accent-strong italic">built</em>, broken and rebuilt.
            </>
          }
          description="A mix of hackathon winners, coursework that got out of hand, and weekend experiments. Most are open source — click through to the code."
        >
          <div className="mt-6">
            <LinkButton href={site.socials.github} external variant="secondary">
              <GithubIcon className="size-4" /> Browse all on GitHub
            </LinkButton>
          </div>
        </PageHeader>
        <ProjectGrid />
      </Container>
      <SiteFooter />
    </>
  );
}
