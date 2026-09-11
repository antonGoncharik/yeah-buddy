"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { WorkoutHistoryRow } from "@/components/workout/workout-history-row";
import { WorkoutHistoryStats } from "@/components/workout/workout-history-stats";
import { calendarToday } from "@/lib/day/dates";
import { groupByMonth } from "@/lib/day/format";
import { REVIEW_CTA_HINT, SESSION_HISTORY_EMPTY } from "@/lib/messages";
import {
  HISTORY_RANGE_OPTIONS,
  useCursorHistory,
} from "@/lib/use-cursor-history";
import {
  hasOlderThanRange,
  isWorkoutHistoryRange,
  summarizeWorkoutHistory,
  windowGymSessions,
} from "@/lib/workout/history-stats";
import { parseRecentSession } from "@/lib/workout/hub-payload";

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

        {showStats ? (
          <WorkoutHistoryStats days={rangeDays} stats={stats} />
        ) : null}

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
                      <WorkoutHistoryRow item={item} />
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
