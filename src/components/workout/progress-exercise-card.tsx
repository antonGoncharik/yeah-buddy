"use client";

import { useState } from "react";

import { FoldChevron } from "@/components/ui/fold-chevron";
import { Segmented } from "@/components/ui/segmented";
import { ProgressChart } from "@/components/workout/progress-chart";
import { ProgressSparkline } from "@/components/workout/progress-sparkline";
import { haptic } from "@/lib/telegram/haptic";
import type { ExerciseProgress, WorkoutKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
import {
  formatSeconds,
  formatSignedPercent,
  formatSignedWeight,
  formatWeight,
} from "@/lib/workout/numbers";
import { measureProgress } from "@/lib/workout/progress-build";
import {
  hasRelativeSeries,
  hasSecondsSeries,
  hasTonnageSeries,
  lastProgressKind,
  type ProgressMetric,
  pointsForKind,
  progressKinds,
} from "@/lib/workout/progress-stats";

export function ProgressExerciseCard({
  item,
  open,
  onToggle,
  record = false,
}: {
  item: ExerciseProgress;
  open: boolean;
  onToggle: () => void;
  record?: boolean;
}) {
  const kinds = progressKinds(item.points);
  const [kind, setKind] = useState<WorkoutKind | null>(() =>
    lastProgressKind(item.points),
  );
  const series = pointsForKind(item.points, kind);
  const stats = measureProgress(series);
  const secondsOk = hasSecondsSeries(series);
  const relativeOk = hasRelativeSeries(series);
  const tonnageOk = hasTonnageSeries(series);
  const [metric, setMetric] = useState<ProgressMetric>(() =>
    hasSecondsSeries(series) ? "seconds" : "weight",
  );
  const lastSeconds = series.at(-1)?.seconds ?? null;
  const metricOptions = [
    { id: "weight" as const, label: "Вес" },
    ...(tonnageOk ? [{ id: "tonnage" as const, label: "Тоннаж" }] : []),
    ...(secondsOk ? [{ id: "seconds" as const, label: "Время" }] : []),
    ...(relativeOk ? [{ id: "relative" as const, label: "К телу" }] : []),
  ];
  const shownMetric =
    metric === "seconds" && !secondsOk
      ? "weight"
      : metric === "relative" && !relativeOk
        ? "weight"
        : metric === "tonnage" && !tonnageOk
          ? "weight"
          : metric;

  return (
    <article className="card-surface px-5 py-4">
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => {
          haptic("tick");
          onToggle();
        }}
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 pt-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-base font-medium">
              {item.name}
            </span>
            <ClosedMark stats={stats} />
          </span>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            {closedDetail(stats, lastSeconds)}
          </p>
          {record ? (
            <span className="mt-1.5 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              рекорд
            </span>
          ) : null}
        </span>
        {open ? null : <ProgressSparkline points={series} className="mt-1" />}
        <FoldChevron open={open} />
      </button>
      {open ? (
        <div className="mt-5 flex flex-col gap-4">
          {kinds.length > 1 ? (
            <Segmented
              value={kind ?? kinds[0] ?? "dynamic"}
              options={kinds.map((id) => ({
                id,
                label: WORKOUT_KIND_LABELS[id],
              }))}
              onChange={(next) => {
                const nextSeries = pointsForKind(item.points, next);
                setKind(next);
                setMetric(hasSecondsSeries(nextSeries) ? "seconds" : "weight");
              }}
            />
          ) : null}
          {metricOptions.length > 1 ? (
            <Segmented
              value={shownMetric}
              options={metricOptions}
              onChange={setMetric}
            />
          ) : null}
          <ProgressChart points={series} metric={shownMetric} />
        </div>
      ) : null}
    </article>
  );
}

const RELATIVE_GAP = 2;

function closedValue(weight: number | null, seconds: number | null): string {
  if (weight != null) {
    return `${formatWeight(weight)} кг`;
  }
  if (seconds != null) {
    return `${formatSeconds(seconds)} с`;
  }
  return "Нет записи";
}

function ClosedMark({ stats }: { stats: ReturnType<typeof measureProgress> }) {
  const percent = headlinePercent(stats);
  if (percent == null || percent === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium tabular-nums",
        percent > 0 ? "bg-primary/15" : "bg-destructive/12 text-destructive",
      )}
    >
      {formatSignedPercent(percent)}
    </span>
  );
}

function closedDetail(
  stats: ReturnType<typeof measureProgress>,
  seconds: number | null,
): string {
  const current = closedValue(stats.current_weight, seconds);
  const barMoved =
    stats.delta != null && stats.percent != null && stats.delta !== 0;
  const parts = [current];
  if (barMoved && stats.delta != null && stats.percent != null) {
    parts.push(`${formatSignedWeight(stats.delta)} кг`);
    if (
      stats.relative_percent != null &&
      Math.abs(stats.relative_percent - stats.percent) >= RELATIVE_GAP
    ) {
      parts.push(`к телу ${formatSignedPercent(stats.relative_percent)}`);
    }
  } else if (stats.tonnage_percent != null && stats.tonnage_percent !== 0) {
    parts.push("тоннаж");
  }
  return parts.join(" · ");
}

function headlinePercent(
  stats: ReturnType<typeof measureProgress>,
): number | null {
  if (stats.delta != null && stats.percent != null && stats.delta !== 0) {
    return stats.percent;
  }
  if (stats.tonnage_percent != null && stats.tonnage_percent !== 0) {
    return stats.tonnage_percent;
  }
  return null;
}
