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
  celebrateOverflow = false,
}: {
  label: string;
  fact: number;
  plan: number;
  barClass: string;
  compact?: boolean;
  kind?: "macro" | "kcal";
  /** Protein past the target stays its own color. Fat and carbs warn. */
  celebrateOverflow?: boolean;
}) {
  const remaining = plan - fact;
  const overflow = remaining < 0;
  const warn = overflow && !celebrateOverflow;
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
            warn && "text-destructive",
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
        overflow={warn}
        size={compact ? "sm" : "md"}
        valueNow={fact}
        valueMax={plan > 0 ? plan : 1}
        valueText={`${formatAmount(fact)} из ${formatAmount(plan)} ${label}`}
      />
    </div>
  );
}
