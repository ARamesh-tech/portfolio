import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { site } from "@/lib/site";
import { Container, PageHeader } from "@/components/ui/page-header";
import { ContactForm } from "@/components/contact-form";
import { CopyButton } from "@/components/copy-button";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with A Ramesh Kumaran — email ${site.email} or call ${site.phone}. Open to backend, data engineering and collaboration conversations.`,
};

export default function ContactPage() {
  return (
    <>
      <Container>
        <PageHeader
          eyebrow="Contact"
          title={
            <>
              Let&apos;s <em className="text-accent-strong italic">talk</em>.
            </>
          }
          description="Questions, collaborations, roles, or just a hello — sign in and the form goes straight to my inbox. If it's urgent, call."
        />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <ContactForm />
          <aside className="space-y-4">
            <div className="card divide-y">
              <ContactRow icon={<Mail className="size-4" />} label="Email" value={site.email} href={`mailto:${site.email}`} copy />
              <ContactRow icon={<Phone className="size-4" />} label="Phone" value={site.phone} href={site.phoneHref} copy />
              <ContactRow icon={<MapPin className="size-4" />} label="Location" value={site.location} />
              <ContactRow icon={<Clock className="size-4" />} label="Timezone" value="IST (UTC+5:30)" />
            </div>
            <div className="card p-4">
              <p className="text-[11px] font-medium tracking-wide text-muted-2 uppercase">Elsewhere</p>
              <div className="mt-2 flex flex-col gap-1.5 text-sm">
                <a href={site.socials.github} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded py-1 text-muted hover:text-foreground">
                  <GithubIcon className="size-4" /> github.com/{site.githubUser}
                </a>
                <a href={site.socials.linkedin} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded py-1 text-muted hover:text-foreground">
                  <LinkedinIcon className="size-4" /> LinkedIn
                </a>
              </div>
            </div>
            <p className="px-1 text-xs leading-relaxed text-muted-2">
              I read every message. Recruiters: please include the role, location/remote policy and compensation range so I can reply
              usefully.
            </p>
          </aside>
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}

function ContactRow({ icon, label, value, href, copy }: { icon: React.ReactNode; label: string; value: string; href?: string; copy?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-wide text-muted-2 uppercase">{label}</p>
        {href ? (
          <a href={href} className="focus-ring block truncate rounded text-sm font-medium hover:text-accent-strong">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium leading-snug">{value}</p>
        )}
      </div>
      {copy && <CopyButton text={value} label={label} />}
    </div>
  );
}
