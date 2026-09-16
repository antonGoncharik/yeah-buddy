"use client";

import { useState } from "react";

import { Segmented } from "@/components/ui/segmented";
import { ProgressChart } from "@/components/workout/progress-chart";
import { ProgressSparkline } from "@/components/workout/progress-sparkline";
import { formatRelative } from "@/lib/day/body-weight";
import type { ExerciseProgress, WorkoutKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
import {
  formatSeconds,
  formatSignedPercent,
  formatSignedWeight,
  formatTonnage,
  formatWeight,
} from "@/lib/workout/numbers";
import { measureProgress } from "@/lib/workout/progress-build";
import {
  hasRelativeSeries,
  hasSecondsSeries,
  lastProgressKind,
  type ProgressMetric,
  pointsForKind,
  progressKinds,
} from "@/lib/workout/progress-stats";

export function ProgressExerciseCard({
  item,
  open,
  onToggle,
}: {
  item: ExerciseProgress;
  open: boolean;
  onToggle: () => void;
}) {
  const kinds = progressKinds(item.points);
  const [kind, setKind] = useState<WorkoutKind | null>(() =>
    lastProgressKind(item.points),
  );
  const series = pointsForKind(item.points, kind);
  const stats = measureProgress(series);
  const secondsOk = hasSecondsSeries(series);
  const relativeOk = hasRelativeSeries(series);
  const [metric, setMetric] = useState<ProgressMetric>(() =>
    hasSecondsSeries(series) ? "seconds" : "weight",
  );
  const lastSeconds = series.at(-1)?.seconds ?? null;
  const metricOptions = [
    { id: "weight" as const, label: "кг" },
    ...(secondsOk ? [{ id: "seconds" as const, label: "сек" }] : []),
    ...(relativeOk ? [{ id: "relative" as const, label: "× веса" }] : []),
  ];
  const shownMetric =
    metric === "seconds" && !secondsOk
      ? "weight"
      : metric === "relative" && !relativeOk
        ? "weight"
        : metric;

  return (
    <article className="card-surface px-5 py-4">
      <button
        type="button"
        className="flex w-full items-center gap-3 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {stats.current_weight == null
              ? "Нет рабочего веса"
              : `${formatWeight(stats.current_weight)} кг`}
            {stats.current_tonnage != null
              ? ` · тоннаж ${formatTonnage(stats.current_tonnage)}`
              : null}
            {stats.current_relative != null
              ? ` · ${formatRelative(stats.current_relative)}`
              : null}
            {lastSeconds != null ? ` · ${formatSeconds(lastSeconds)} с` : null}
            {stats.delta != null &&
            stats.percent != null &&
            stats.delta !== 0 ? (
              <span
                className={cn(
                  "ml-2 font-medium",
                  stats.delta > 0 && "text-primary",
                  stats.delta < 0 && "text-destructive",
                )}
              >
                {formatSignedWeight(stats.delta)} кг ·{" "}
                {formatSignedPercent(stats.percent)}
                {stats.relative_percent == null
                  ? null
                  : ` · ${formatSignedPercent(stats.relative_percent)} к весу`}
              </span>
            ) : null}
            {stats.tonnage_percent != null && stats.tonnage_percent !== 0 ? (
              <span
                className={cn(
                  "ml-2 font-medium",
                  (stats.delta ?? 0) === 0 && "text-primary",
                )}
              >
                тоннаж {formatSignedPercent(stats.tonnage_percent)}
              </span>
            ) : null}
          </p>
        </div>
        <ProgressSparkline points={series} />
      </button>
      {open ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4">
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
