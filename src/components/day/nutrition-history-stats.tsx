"use client";

import { formatProteinPerKg } from "@/lib/day/body-weight";
import { DAY_TYPE_LABELS, formatKcal, formatMacro } from "@/lib/nutrition";
import {
  type MacroAverages,
  type NutritionHits,
  type NutritionRange,
  pluralDays,
  type proteinPerKgStats,
} from "@/lib/nutrition-stats";
import { cn } from "@/lib/utils";

export function NutritionHistoryStats({
  days,
  count,
  rest,
  training,
  hits,
  perKg,
}: {
  days: NutritionRange;
  count: number;
  rest: MacroAverages | null;
  training: MacroAverages | null;
  hits: NutritionHits;
  perKg: ReturnType<typeof proteinPerKgStats>;
}) {
  const showHits = hits.proteinTotal > 0 || hits.kcalTotal > 0;

  return (
    <section className="card-surface animate-rise flex flex-col gap-5 px-5 py-5">
      <p className="text-sm font-medium text-muted-foreground">
        За {days} дней
      </p>
      <p className="text-3xl font-semibold tracking-tight">
        {count}
        <span className="ml-2 text-lg font-medium text-muted-foreground">
          {pluralDays(count)}
        </span>
      </p>
      {rest ? <TypeAverage label={DAY_TYPE_LABELS.rest} stats={rest} /> : null}
      {training ? (
        <TypeAverage label={DAY_TYPE_LABELS.training} stats={training} />
      ) : null}
      {showHits ? (
        <div className="flex flex-col gap-3 border-t border-border/70 pt-4">
          <HitRow
            label="Белок дотянули"
            hit={hits.proteinHit}
            total={hits.proteinTotal}
            barClass="bg-[var(--macro-protein)]"
          />
          <HitRow
            label="Калории около цели"
            hit={hits.kcalHit}
            total={hits.kcalTotal}
            barClass="bg-primary"
          />
          {perKg ? (
            <p className="text-sm text-muted-foreground">
              Белок {formatProteinPerKg(perKg.fact)} при цели{" "}
              {formatProteinPerKg(perKg.target)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function TypeAverage({
  label,
  stats,
}: {
  label: string;
  stats: MacroAverages;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-muted-foreground">
        {label} · {stats.count} {pluralDays(stats.count)}
      </p>
      <p className="text-xl font-semibold tracking-tight tabular-nums">
        {formatKcal(stats.fact.kcal)}
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">
          / {formatKcal(stats.target.kcal)} ккал
        </span>
      </p>
      <p className="text-sm text-muted-foreground">
        Б {formatMacro(stats.fact.protein)} /{" "}
        {formatMacro(stats.target.protein)} · Ж {formatMacro(stats.fact.fat)} /{" "}
        {formatMacro(stats.target.fat)} · У {formatMacro(stats.fact.carbs)} /{" "}
        {formatMacro(stats.target.carbs)}
      </p>
    </div>
  );
}

function HitRow({
  label,
  hit,
  total,
  barClass,
}: {
  label: string;
  hit: number;
  total: number;
  barClass: string;
}) {
  if (total === 0) {
    return null;
  }

  const ratio = hit / total;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {hit} из {total}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
