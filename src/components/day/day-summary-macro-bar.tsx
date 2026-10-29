"use client";

import { MeterBar } from "@/components/ui/meter-bar";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import { macroOverGoal } from "@/lib/nutrition/macro-hit";
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
  const overflow =
    kind === "macro" ? macroOverGoal(fact, plan) : plan > 0 && fact > plan;
  const warn = overflow && !celebrateOverflow;
  const ratio = plan > 0 ? Math.min(fact / plan, 1) : 0;
  const formatAmount = (value: number) =>
    kind === "kcal" ? formatKcal(value) : formatMacro(value);

  const amounts = (
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
  );
  const meter = (
    <MeterBar
      ratio={ratio}
      barClass={barClass}
      overflow={warn}
      size={compact ? "sm" : "md"}
      valueNow={fact}
      valueMax={plan > 0 ? plan : 1}
      valueText={`${formatAmount(fact)} из ${formatAmount(plan)} ${label}`}
    />
  );

  if (compact) {
    return (
      <>
        <p className="font-medium whitespace-nowrap">{label}</p>
        <div className="min-w-0">{meter}</div>
        <span
          className={cn(
            "text-right font-medium tabular-nums",
            warn ? "text-destructive" : "text-foreground",
          )}
        >
          {formatAmount(fact)}
        </span>
        <span className={cn(warn && "text-destructive")}>/</span>
        <span
          className={cn(
            "tabular-nums text-muted-foreground",
            warn && "text-destructive",
          )}
        >
          {formatAmount(plan)}
        </span>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-base">
        <p className="font-medium">{label}</p>
        {amounts}
      </div>
      {meter}
    </div>
  );
}
