import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "warm";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "neutral" && "bg-surface-2 text-muted",
        tone === "accent" && "border-accent/30 bg-accent-soft text-accent-strong",
        tone === "warm" && "border-warm/30 bg-warm-soft text-warm",
        className,
      )}
    >
      {children}
    </span>
  );
}
