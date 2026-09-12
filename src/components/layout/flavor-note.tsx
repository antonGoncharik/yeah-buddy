"use client";

import { cn } from "@/lib/utils";

export function FlavorNote({
  line,
  className,
}: {
  line: string | null;
  className?: string;
}) {
  if (!line) {
    return null;
  }

  return <p className={cn("text-base leading-relaxed", className)}>{line}</p>;
}
