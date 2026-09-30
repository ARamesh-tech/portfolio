import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-accent-strong uppercase">404</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight">This route returned nothing.</h1>
      <p className="mt-3 max-w-md text-muted">Like a query with a typo in the WHERE clause. Let&apos;s get you back to something that exists.</p>
      <div className="mt-8 flex gap-3">
        <LinkButton href="/">
          <Home className="size-4" /> Home
        </LinkButton>
        <LinkButton href="/blog" variant="secondary">
          <ArrowLeft className="size-4" /> Blog
        </LinkButton>
      </div>
      <p className="mt-10 text-xs text-muted-2">
        Tip: press <kbd className="rounded border bg-surface px-1.5 py-0.5 font-mono">⌘K</kbd> to search the site.
      </p>
      <Link href="/contact" className="sr-only">
        Contact
      </Link>
    </div>
  );
}
