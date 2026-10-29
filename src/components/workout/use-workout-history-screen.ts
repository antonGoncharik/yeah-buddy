"use client";

import { useEffect, useMemo, useState } from "react";

import { calendarToday } from "@/lib/day/dates";
import { groupByMonth } from "@/lib/day/format";
import { diaryRangeStart, historyNeedsOlder } from "@/lib/diary-range";
import { useCursorHistory } from "@/lib/use-cursor-history";
import {
  hasOlderThanRange,
  isWorkoutHistoryRange,
  summarizeWorkoutHistory,
  windowGymSessions,
} from "@/lib/workout/history-stats";
import { parseRecentSession } from "@/lib/workout/hub-payload";

export type WorkoutHistoryRangeId = "14" | "30" | "90";

export function useWorkoutHistoryScreen() {
  const today = calendarToday();
  const { items, nextBefore, loading, loadingMore, error, load } =
    useCursorHistory("/api/sessions/history", parseRecentSession);
  const [range, setRange] = useState<WorkoutHistoryRangeId>("14");

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

  return {
    today,
    items,
    nextBefore,
    loading,
    loadingMore,
    error,
    load,
    range,
    setRange,
    rangeDays,
    from,
    stats,
    showRange,
    listed,
    groups,
    showStats,
    needsMore,
    windowed,
  };
}
