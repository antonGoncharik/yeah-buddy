import {
  type DiaryRange,
  diaryRangeStart,
  isDiaryRange,
} from "@/lib/diary-range";
import type { DayHistoryRow } from "@/lib/types";

export type NutritionRange = DiaryRange;

export function isNutritionRange(value: number): value is NutritionRange {
  return isDiaryRange(value);
}

export function windowDays(
  items: DayHistoryRow[],
  days: NutritionRange,
  todayIso: string,
): DayHistoryRow[] {
  const start = diaryRangeStart(todayIso, days);
  if (!start) {
    return [];
  }

  return items.filter((item) => item.date >= start && item.date <= todayIso);
}

export function hasOlderThanRange(
  items: DayHistoryRow[],
  days: NutritionRange,
  todayIso: string,
): boolean {
  const start = diaryRangeStart(todayIso, days);
  if (!start) {
    return false;
  }

  return items.some((item) => item.date < start);
}

export function chronological(items: DayHistoryRow[]): DayHistoryRow[] {
  return [...items].reverse();
}
