"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { calendarToday } from "@/lib/day/dates";
import { formatIsoDate, groupByMonth } from "@/lib/day/format";
import { REVIEW_CTA_HINT, SESSION_HISTORY_EMPTY } from "@/lib/messages";
import {
  HISTORY_RANGE_OPTIONS,
  useCursorHistory,
} from "@/lib/use-cursor-history";
import {
  hasOlderThanRange,
  isWorkoutHistoryRange,
  pluralWorkouts,
  summarizeWorkoutHistory,
  type WorkoutHistoryRange,
  type WorkoutHistoryStats,
  windowGymSessions,
} from "@/lib/workout/history-stats";
import { parseRecentSession } from "@/lib/workout/hub-payload";
import {
  SESSION_STATUS_LABELS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";

type RangeId = "14" | "30";

export function WorkoutHistoryScreen() {
  const today = calendarToday();
  const { items, nextBefore, loading, loadingMore, error, load } =
    useCursorHistory("/api/sessions/history", parseRecentSession);
  const [range, setRange] = useState<RangeId>("14");

  const parsedRange = Number(range);
  const rangeDays = isWorkoutHistoryRange(parsedRange) ? parsedRange : 14;
  const windowed = useMemo(
    () => windowGymSessions(items, rangeDays, today),
    [items, rangeDays, today],
  );
  const stats = useMemo(() => summarizeWorkoutHistory(windowed), [windowed]);
  const groups = useMemo(
    () => groupByMonth(items, (item) => item.session.session_date),
    [items],
  );
  const showRange = hasOlderThanRange(items, 14, today);
  const showStats = !loading && stats.count > 0;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="История тренировок" backHref="/workouts" />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && items.length === 0 ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <section className="card-surface animate-rise px-5 py-5">
            <p className="text-lg font-medium">{SESSION_HISTORY_EMPTY}</p>
          </section>
        ) : null}

        {showStats && showRange ? (
          <div className="animate-rise">
            <Segmented
              value={range}
              options={HISTORY_RANGE_OPTIONS}
              onChange={setRange}
            />
          </div>
        ) : null}

        {showStats ? <StatsCard days={rangeDays} stats={stats} /> : null}

        {showStats ? (
          <Link
            href="/settings/review?from=gym"
            className="card-surface animate-rise flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium">Как прошло</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {REVIEW_CTA_HINT}
              </span>
            </span>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Link>
        ) : null}

        {!loading && groups.length > 0 ? (
          <div className="animate-rise flex flex-col gap-6">
            {groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-medium capitalize text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.session.id}>
                      <Link
                        href={`/workouts/sessions/${item.session.id}`}
                        className="card-surface flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-medium">
                            {item.template_name ??
                              WORKOUT_KIND_LABELS[item.session.workout_type]}
                          </span>
                          {item.summary ? (
                            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                              {item.summary}
                            </span>
                          ) : item.session.status !== "completed" ? (
                            <span className="text-sm text-muted-foreground">
                              {SESSION_STATUS_LABELS[item.session.status]}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                          {formatIsoDate(item.session.session_date, "d MMMM")}
                          <ChevronRight className="size-4" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        {nextBefore ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 text-base"
            disabled={loadingMore}
            onClick={() => void load(nextBefore)}
          >
            {loadingMore ? "Загрузка…" : "Ещё"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function StatsCard({
  days,
  stats,
}: {
  days: WorkoutHistoryRange;
  stats: WorkoutHistoryStats;
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
