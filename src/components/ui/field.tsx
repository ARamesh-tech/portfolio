import { cn } from "@/lib/utils";

const inputBase =
  "focus-ring w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-2 transition-colors hover:border-border-strong focus:border-accent disabled:opacity-60";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "min-h-32 resize-y leading-relaxed", className)} {...props} />;
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium text-muted", className)} {...props}>
      {children}
    </label>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-2">{hint}</p>}
    </div>
  );
}
