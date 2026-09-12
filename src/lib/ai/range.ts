import { shiftIsoDate } from "@/lib/day/dates";

export const REVIEW_RANGES = [14, 30] as const;

export type ReviewRange = (typeof REVIEW_RANGES)[number];

export function isReviewRange(value: unknown): value is ReviewRange {
  return value === 14 || value === 30;
}

export function reviewWindow(
  todayIso: string,
  days: ReviewRange,
): { start: string; end: string } {
  return {
    start: shiftIsoDate(todayIso, 1 - days),
    end: todayIso,
  };
}
