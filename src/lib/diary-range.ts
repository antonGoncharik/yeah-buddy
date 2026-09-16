import { isIsoDate, shiftIsoDate } from "@/lib/day/dates";

export const DIARY_RANGES = [14, 30, 90] as const;

export type DiaryRange = (typeof DIARY_RANGES)[number];

export const DIARY_RANGE_OPTIONS: Array<{
  id: `${DiaryRange}`;
  label: string;
}> = [
  { id: "14", label: "14 дн" },
  { id: "30", label: "30 дн" },
  { id: "90", label: "90 дн" },
];

export function isDiaryRange(value: number): value is DiaryRange {
  return value === 14 || value === 30 || value === 90;
}

export function diaryRangeStart(todayIso: string, days: number): string | null {
  if (!isIsoDate(todayIso) || !Number.isInteger(days) || days < 1) {
    return null;
  }

  return shiftIsoDate(todayIso, 1 - days);
}

/** True when the oldest loaded row is still inside the window, so more pages exist. */
export function historyNeedsOlder(
  oldestDate: string | undefined,
  nextBefore: string | null,
  todayIso: string,
  days: number,
): boolean {
  if (!nextBefore) {
    return false;
  }
  const start = diaryRangeStart(todayIso, days);
  if (!start || !oldestDate) {
    return Boolean(nextBefore);
  }
  return oldestDate > start;
}
