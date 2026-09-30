import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-10 animate-fade-up", className)}>
      {eyebrow && <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-accent-strong uppercase">{eyebrow}</p>}
      <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted text-pretty">{description}</p>}
      {children}
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="mb-1.5 font-mono text-[11px] tracking-[0.2em] text-accent-strong uppercase">{eyebrow}</p>}
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Container({ children, className, size = "default" }: { children: React.ReactNode; className?: string; size?: "default" | "narrow" | "wide" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 py-10 sm:px-8 sm:py-14 lg:px-12",
        size === "default" && "max-w-5xl",
        size === "narrow" && "max-w-3xl",
        size === "wide" && "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
