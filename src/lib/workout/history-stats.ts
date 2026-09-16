import { inclusiveDayCount, shiftIsoDate } from "@/lib/day/dates";
import {
  type DiaryRange,
  diaryRangeStart,
  isDiaryRange,
} from "@/lib/diary-range";
import type { RecentWorkoutSession } from "@/lib/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export type WorkoutHistoryRange = DiaryRange;

export function isWorkoutHistoryRange(
  value: number,
): value is WorkoutHistoryRange {
  return isDiaryRange(value);
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

export function workoutsPerWeek(count: number, days: number): number {
  if (count <= 0 || days < 7) {
    return 0;
  }

  return Math.round((count / (days / 7)) * 10) / 10;
}

export function formatWeekRate(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(".", ",");
}

export function formatWorkoutsPerWeek(
  count: number,
  days: number,
): string | null {
  const value = workoutsPerWeek(count, days);
  if (value <= 0) {
    return null;
  }

  return `${formatWeekRate(value)} в неделю`;
}

export function formatFrequencyVsProgram(
  count: number,
  days: number,
  circleSize: number,
): string | null {
  const perWeek = formatWorkoutsPerWeek(count, days);
  if (!perWeek) {
    return null;
  }
  if (circleSize <= 0) {
    return perWeek;
  }

  return `${perWeek} · ${circleSize} в круге`;
}

export function sessionRateHalves(
  dates: string[],
  from: string,
  to: string,
): { first: number; second: number } | null {
  const days = inclusiveDayCount(from, to);
  if (days < 14) {
    return null;
  }

  const mid = shiftIsoDate(from, Math.floor(days / 2));
  const firstEnd = shiftIsoDate(mid, -1);
  if (firstEnd < from) {
    return null;
  }

  let firstCount = 0;
  let secondCount = 0;
  for (const date of new Set(dates)) {
    if (date < from || date > to) {
      continue;
    }
    if (date < mid) {
      firstCount += 1;
    } else {
      secondCount += 1;
    }
  }

  const first = workoutsPerWeek(firstCount, inclusiveDayCount(from, firstEnd));
  const second = workoutsPerWeek(secondCount, inclusiveDayCount(mid, to));
  if ((first <= 0 && second <= 0) || first === second) {
    return null;
  }

  return { first, second };
}

export function formatSessionRateHalves(halves: {
  first: number;
  second: number;
}): string {
  return `сначала ${formatWeekRate(halves.first)}, потом ${formatWeekRate(halves.second)} в неделю`;
}

function rangeStart(
  todayIso: string,
  days: WorkoutHistoryRange,
): string | null {
  return diaryRangeStart(todayIso, days);
}
