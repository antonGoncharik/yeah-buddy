"use client";

import { useState } from "react";

import { Segmented } from "@/components/ui/segmented";
import { ProgressChart } from "@/components/workout/progress-chart";
import { ProgressSparkline } from "@/components/workout/progress-sparkline";
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
        className="flex w-full items-center gap-3 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">
            {item.name}
            {record ? (
              <span className="ml-2 text-sm font-medium text-primary">
                рекорд
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
            {closedValue(stats.current_weight, lastSeconds)}
          </p>
          <ClosedChange stats={stats} />
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

function ClosedChange({
  stats,
}: {
  stats: ReturnType<typeof measureProgress>;
}) {
  const barMoved =
    stats.delta != null && stats.percent != null && stats.delta !== 0;
  const relative =
    barMoved &&
    stats.relative_percent != null &&
    stats.percent != null &&
    Math.abs(stats.relative_percent - stats.percent) >= RELATIVE_GAP
      ? stats.relative_percent
      : null;

  if (barMoved && stats.delta != null && stats.percent != null) {
    return (
      <p
        className={cn(
          "text-sm font-medium tabular-nums",
          stats.delta > 0 && "text-primary",
          stats.delta < 0 && "text-destructive",
        )}
      >
        {formatSignedWeight(stats.delta)} кг
        <span className="ml-2">{formatSignedPercent(stats.percent)}</span>
        {relative != null ? (
          <span className="ml-2 font-normal text-muted-foreground">
            к телу {formatSignedPercent(relative)}
          </span>
        ) : null}
      </p>
    );
  }

  if (stats.tonnage_percent != null && stats.tonnage_percent !== 0) {
    return (
      <p className="text-sm font-medium tabular-nums text-primary">
        тоннаж {formatSignedPercent(stats.tonnage_percent)}
      </p>
    );
  }

  return null;
}
