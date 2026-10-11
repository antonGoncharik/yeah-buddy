"use client";

import { MeterBar } from "@/components/ui/meter-bar";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export function MacroBar({
  label,
  fact,
  plan,
  barClass,
  compact = false,
  kind = "macro",
}: {
  label: string;
  fact: number;
  plan: number;
  barClass: string;
  compact?: boolean;
  kind?: "macro" | "kcal";
}) {
  const remaining = plan - fact;
  const overflow = remaining < 0;
  const ratio = plan > 0 ? Math.min(fact / plan, 1) : 0;
  const formatAmount = (value: number) =>
    kind === "kcal" ? formatKcal(value) : formatMacro(value);

  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}>
      <div
        className={cn(
          "flex items-baseline justify-between gap-3",
          compact ? "text-sm" : "text-base",
        )}
      >
        <p className="font-medium">{label}</p>
        <p
          className={cn(
            "flex items-baseline gap-1.5 tabular-nums text-muted-foreground",
            overflow && "text-destructive",
          )}
        >
          <span className={cn("text-right", !overflow && "text-foreground")}>
            {formatAmount(fact)}
          </span>
          <span>/</span>
          <span>{formatAmount(plan)}</span>
        </p>
      </div>
      <MeterBar
        ratio={ratio}
        barClass={barClass}
        overflow={overflow}
        size={compact ? "sm" : "md"}
      />
    </div>
  );
}
