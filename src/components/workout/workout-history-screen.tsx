"use client";

import { useEffect, useMemo, useState } from "react";

import { ReviewCta } from "@/components/ai/review-cta";
import { AppHeader } from "@/components/layout/app-header";
import { BarbellDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { EmptyNote } from "@/components/layout/empty-note";
import { NavRow } from "@/components/layout/nav-row";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { WorkoutHistoryRow } from "@/components/workout/workout-history-row";
import { WorkoutHistoryStats } from "@/components/workout/workout-history-stats";
import { calendarToday } from "@/lib/day/dates";
import { groupByMonth } from "@/lib/day/format";
import { diaryRangeStart, historyNeedsOlder } from "@/lib/diary-range";
import {
  SESSION_HISTORY_EMPTY,
  SESSION_HISTORY_EMPTY_HINT,
} from "@/lib/messages";
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

type RangeId = "14" | "30" | "90";

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

  useEffect(() => {
    if (loading || loadingMore || !nextBefore) {
      return;
    }
    if (
      historyNeedsOlder(
        items.at(-1)?.session.session_date,
        nextBefore,
        today,
        rangeDays,
      )
    ) {
      void load(nextBefore);
    }
  }, [items, load, loading, loadingMore, nextBefore, rangeDays, today]);
  const from = diaryRangeStart(today, rangeDays) ?? today;
  const stats = useMemo(() => summarizeWorkoutHistory(windowed), [windowed]);
  const showRange = hasOlderThanRange(items, 14, today);
  const listed = useMemo(() => {
    if (!showRange) {
      return items;
    }
    return items.filter((item) => {
      const date = item.session.session_date;
      return date >= from && date <= today;
    });
  }, [from, items, showRange, today]);
  const groups = useMemo(
    () => groupByMonth(listed, (item) => item.session.session_date),
    [listed],
  );
  const showStats = !loading && stats.count > 0;
  const needsMore = historyNeedsOlder(
    items.at(-1)?.session.session_date,
    nextBefore,
    today,
    rangeDays,
  );

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="История тренировок" backHref="/workouts" />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && items.length === 0 ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <EmptyNote
            icon={<DumbbellDoodle className="h-5 w-10" />}
            title={SESSION_HISTORY_EMPTY}
            hint={SESSION_HISTORY_EMPTY_HINT}
          />
        ) : null}

        {!loading && showRange ? (
          <div className="animate-rise">
            <Segmented
              value={range}
              options={HISTORY_RANGE_OPTIONS}
              onChange={setRange}
            />
          </div>
        ) : null}

        {showStats ? (
          <WorkoutHistoryStats
            days={rangeDays}
            stats={stats}
            from={from}
            to={today}
            dates={windowed.map((item) => item.session.session_date)}
          />
        ) : null}

        {!loading && items.length > 0 && listed.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            За эти дни зала не было.
          </p>
        ) : null}

        {!loading && groups.length > 0 ? (
          <div className="animate-rise flex flex-col gap-6">
            {groups.map((group) => (
              <section key={group.key} className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-medium capitalize text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="card-surface divide-y divide-border/70 px-5 py-1">
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

        {needsMore ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 text-base"
            disabled={loadingMore}
            onClick={() => {
              if (nextBefore) {
                void load(nextBefore);
              }
            }}
          >
            {loadingMore ? "Загрузка…" : "Ещё"}
          </Button>
        ) : null}

        {showStats ? (
          <>
            <ReviewCta from="gym" />
            <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
              <NavRow
                href="/workouts/progress"
                title="Рабочие веса"
                hint="Как менялись за 90 дней"
                icon={<BarbellDoodle />}
              />
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
