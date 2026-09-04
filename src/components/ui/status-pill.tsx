import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  className,
  tone = "muted",
}: {
  children: ReactNode;
  className?: string;
  tone?: "muted" | "strong";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 tabular-nums",
        tone === "muted" && "bg-muted text-xs font-medium text-foreground/75",
        tone === "strong" &&
          "bg-foreground/8 text-sm font-semibold text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
