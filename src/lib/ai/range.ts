import { shiftIsoDate } from "@/lib/day/dates";
import { DIARY_RANGES, type DiaryRange, isDiaryRange } from "@/lib/diary-range";

export const REVIEW_RANGES = DIARY_RANGES;

export type ReviewRange = DiaryRange;

export function isReviewRange(value: unknown): value is ReviewRange {
  return typeof value === "number" && isDiaryRange(value);
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
