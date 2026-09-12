import { isIsoDate, shiftIsoDate } from "@/lib/day/dates";
import type { DayHistoryRow } from "@/lib/types";

export type NutritionRange = 14 | 30;

export function isNutritionRange(value: number): value is NutritionRange {
  return value === 14 || value === 30;
}

export function windowDays(
  items: DayHistoryRow[],
  days: NutritionRange,
  todayIso: string,
): DayHistoryRow[] {
  const start = rangeStart(todayIso, days);
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
  const start = rangeStart(todayIso, days);
  if (!start) {
    return false;
  }

  return items.some((item) => item.date < start);
}

export function chronological(items: DayHistoryRow[]): DayHistoryRow[] {
  return [...items].reverse();
}

function rangeStart(todayIso: string, days: NutritionRange): string | null {
  if (!isIsoDate(todayIso)) {
    return null;
  }

  return shiftIsoDate(todayIso, 1 - days);
}
