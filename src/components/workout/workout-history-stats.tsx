"use client";

import {
  pluralWorkouts,
  type WorkoutHistoryRange,
  type WorkoutHistoryStats as WorkoutHistoryStatsData,
} from "@/lib/workout/history-stats";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function WorkoutHistoryStats({
  days,
  stats,
}: {
  days: WorkoutHistoryRange;
  stats: WorkoutHistoryStatsData;
}) {
  const kinds = [
    stats.dynamic > 0
      ? `${WORKOUT_KIND_LABELS.dynamic} · ${stats.dynamic}`
      : null,
    stats.static > 0 ? `${WORKOUT_KIND_LABELS.static} · ${stats.static}` : null,
  ].filter((value): value is string => value != null);

  return (
    <section className="card-surface animate-rise flex flex-col gap-5 px-5 py-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          За {days} дней
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {stats.count}
          <span className="ml-2 text-lg font-medium text-muted-foreground">
            {pluralWorkouts(stats.count)}
          </span>
        </p>
        {kinds.length > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {kinds.join(" · ")}
          </p>
        ) : null}
        {stats.templates.length > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.templates
              .map((item) => `${item.name} · ${item.count}`)
              .join(", ")}
          </p>
        ) : null}
      </div>
      {stats.planTotal > 0 ? (
        <HitRow
          label="Не слабее плана"
          hit={stats.planHit}
          total={stats.planTotal}
        />
      ) : null}
    </section>
  );
}

function HitRow({
  label,
  hit,
  total,
}: {
  label: string;
  hit: number;
  total: number;
}) {
  const ratio = hit / total;

  return (
    <div className="flex flex-col gap-1.5 border-t border-border/70 pt-4">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {hit} из {total}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
