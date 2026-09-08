import { format, parseISO, subDays } from "date-fns";

import type { RecentWorkoutSession } from "@/lib/types";

export type WorkoutHistoryRange = 14 | 30;

export type WorkoutHistoryStats = {
  count: number;
  dynamic: number;
  static: number;
  planHit: number;
  planTotal: number;
};

export function windowGymSessions(
  items: RecentWorkoutSession[],
  days: WorkoutHistoryRange,
  todayIso: string,
): RecentWorkoutSession[] {
  const start = rangeStart(todayIso, days);
  if (!start) {
    return [];
  }

  return items.filter((item) => {
    if (item.session.kind !== "gym" || item.session.status !== "completed") {
      return false;
    }
    const date = item.session.session_date;
    return date >= start && date <= todayIso;
  });
}

export function summarizeWorkoutHistory(
  items: RecentWorkoutSession[],
): WorkoutHistoryStats {
  let dynamic = 0;
  let staticCount = 0;
  let planHit = 0;
  let planTotal = 0;

  for (const item of items) {
    if (item.session.workout_type === "static") {
      staticCount += 1;
    } else {
      dynamic += 1;
    }
    planHit += item.plan_hit ?? 0;
    planTotal += item.plan_total ?? 0;
  }

  return {
    count: items.length,
    dynamic,
    static: staticCount,
    planHit,
    planTotal,
  };
}

export function hasOlderThanRange(
  items: RecentWorkoutSession[],
  days: WorkoutHistoryRange,
  todayIso: string,
): boolean {
  const start = rangeStart(todayIso, days);
  if (!start) {
    return false;
  }

  return items.some((item) => {
    if (item.session.kind !== "gym" || item.session.status !== "completed") {
      return false;
    }
    return item.session.session_date < start;
  });
}

export function pluralWorkouts(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return "тренировок";
  }
  if (mod10 === 1) {
    return "тренировка";
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return "тренировки";
  }
  return "тренировок";
}

function rangeStart(
  todayIso: string,
  days: WorkoutHistoryRange,
): string | null {
  try {
    return format(subDays(parseISO(todayIso), days - 1), "yyyy-MM-dd");
  } catch {
    return null;
  }
}
