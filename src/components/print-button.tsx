"use client";

import { Printer } from "lucide-react";
import { Button } from "./ui/button";

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer className="size-4" /> Download PDF
    </Button>
  );
}
