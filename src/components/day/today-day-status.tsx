"use client";

import { formatGrams, formatKcal } from "@/lib/nutrition";
import { macroInGoal } from "@/lib/nutrition/macro-hit";
import { cn } from "@/lib/utils";

export function TodayDayStatus({
  protein,
  targetProtein,
  kcal,
  targetKcal,
  gymLine,
  className,
}: {
  protein: number;
  targetProtein: number;
  kcal: number;
  targetKcal: number;
  gymLine?: string | null;
  className?: string;
}) {
  const proteinOk = macroInGoal(protein, targetProtein);
  const kcalOk = macroInGoal(kcal, targetKcal);
  const done = proteinOk && kcalOk;

  return (
    <div
      className={cn(
        "card-surface animate-rise flex flex-col gap-1 px-5 py-3 text-sm",
        className,
      )}
    >
      <p className="font-medium">
        {done ? "День в порядке" : "Итог дня"}
      </p>
      <p className="text-muted-foreground tabular-nums">
        Белок {formatGrams(protein)} / {formatGrams(targetProtein)} г ·{" "}
        {formatKcal(kcal)} / {formatKcal(targetKcal)} ккал
      </p>
      {gymLine ? (
        <p className="text-muted-foreground">{gymLine}</p>
      ) : null}
    </div>
  );
}
