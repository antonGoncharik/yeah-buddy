import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function MarkBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
