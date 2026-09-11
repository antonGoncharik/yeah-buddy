"use client";

import { useState } from "react";

import { Segmented } from "@/components/ui/segmented";
import { ProgressChart } from "@/components/workout/progress-chart";
import { ProgressSparkline } from "@/components/workout/progress-sparkline";
import { formatRelative } from "@/lib/day/body-weight";
import type { ExerciseProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  formatSeconds,
  formatSignedPercent,
  formatSignedWeight,
  formatWeight,
} from "@/lib/workout/numbers";
import {
  hasRelativeSeries,
  hasSecondsSeries,
  type ProgressMetric,
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
  const secondsOk = hasSecondsSeries(item.points);
  const relativeOk = hasRelativeSeries(item.points);
  const [metric, setMetric] = useState<ProgressMetric>(
    secondsOk ? "seconds" : "weight",
  );
  const lastSeconds = item.points.at(-1)?.seconds ?? null;
  const metricOptions = [
    { id: "weight" as const, label: "кг" },
    ...(secondsOk ? [{ id: "seconds" as const, label: "сек" }] : []),
    ...(relativeOk ? [{ id: "relative" as const, label: "× веса" }] : []),
  ];

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
            {item.current_weight == null
              ? "Нет рабочего веса"
              : `${formatWeight(item.current_weight)} кг`}
            {item.current_relative != null
              ? ` · ${formatRelative(item.current_relative)}`
              : null}
            {lastSeconds != null ? ` · ${formatSeconds(lastSeconds)} с` : null}
            {item.delta != null && item.percent != null ? (
              <span
                className={cn(
                  "ml-2 font-medium",
                  item.delta > 0 && "text-primary",
                  item.delta < 0 && "text-destructive",
                )}
              >
                {formatSignedWeight(item.delta)} кг ·{" "}
                {formatSignedPercent(item.percent)}
                {item.relative_percent == null
                  ? null
                  : ` · ${formatSignedPercent(item.relative_percent)} к весу`}
              </span>
            ) : null}
          </p>
        </div>
        <ProgressSparkline points={item.points} />
      </button>
      {open ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4">
          {metricOptions.length > 1 ? (
            <Segmented
              value={metric}
              options={metricOptions}
              onChange={setMetric}
            />
          ) : null}
          <ProgressChart points={item.points} metric={metric} />
        </div>
      ) : null}
    </article>
  );
}
