import { isIsoDate, shiftIsoDate } from "@/lib/day/dates";
import type { RecentWorkoutSession } from "@/lib/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export type WorkoutHistoryRange = 14 | 30;

export function isWorkoutHistoryRange(
  value: number,
): value is WorkoutHistoryRange {
  return value === 14 || value === 30;
}

export type WorkoutHistoryStats = {
  count: number;
  dynamic: number;
  static: number;
  planHit: number;
  planTotal: number;
  templates: Array<{ name: string; count: number }>;
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
    if (item.session.status !== "completed") {
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
  const templateCounts = new Map<string, number>();

  for (const item of items) {
    if (item.session.workout_type === "static") {
      staticCount += 1;
    } else {
      dynamic += 1;
    }
    planHit += item.plan_hit ?? 0;
    planTotal += item.plan_total ?? 0;

    const name =
      item.template_name?.trim() ||
      WORKOUT_KIND_LABELS[item.session.workout_type];
    templateCounts.set(name, (templateCounts.get(name) ?? 0) + 1);
  }

  const templates = [...templateCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.name.localeCompare(right.name, "ru");
    });

  return {
    count: items.length,
    dynamic,
    static: staticCount,
    planHit,
    planTotal,
    templates,
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
    if (item.session.status !== "completed") {
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
  if (!isIsoDate(todayIso)) {
    return null;
  }

  return shiftIsoDate(todayIso, 1 - days);
}
