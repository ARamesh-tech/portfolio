"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-warm uppercase">500</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Something went sideways.</h1>
      <p className="mt-3 max-w-md text-muted">The error has been logged. You can try again, or head back home.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-2">ref: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>
          <RotateCcw className="size-4" /> Try again
        </Button>
        <LinkButton href="/" variant="secondary">
          Home
        </LinkButton>
      </div>
    </div>
  );
}
