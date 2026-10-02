import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Two right-aligned columns. Same widths on every row, so 50 and 37.5
 * share a vertical line and the unit sits in its own column.
 */
export function AlignedPair({
  leading,
  trailing,
  beside = false,
  className,
}: {
  leading: ReactNode;
  trailing: ReactNode;
  /** Unit starts just after the number. Use when the unit width varies. */
  beside?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 items-baseline gap-x-1.5 tabular-nums",
        beside ? "grid-cols-[4.5rem_auto]" : "grid-cols-[4.5rem_3.6rem]",
        className,
      )}
    >
      <span className="min-w-0 text-right">{leading}</span>
      <span className={cn("min-w-0", beside ? "text-left" : "text-right")}>
        {trailing}
      </span>
    </span>
  );
}
