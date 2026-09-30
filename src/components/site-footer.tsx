import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="no-print border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>
          © {new Date().getFullYear()} {site.name}. Built with Next.js, PostgreSQL &amp; a fondness for terminals.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/resume" className="hover:text-foreground">
            Résumé
          </Link>
          <a href={site.socials.github} target="_blank" rel="noreferrer" className="hover:text-foreground">
            GitHub
          </a>
          <a href={site.socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-foreground">
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
