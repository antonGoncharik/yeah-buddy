import { format, parseISO, subDays } from "date-fns";

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
    start: format(subDays(parseISO(todayIso), days - 1), "yyyy-MM-dd"),
    end: todayIso,
  };
}
