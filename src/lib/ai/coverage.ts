import type { ReviewCoverage } from "@/lib/ai/types";

export const REVIEW_FOOD_DAYS = 7;
export const REVIEW_GYM_SESSIONS = 4;
export const REVIEW_OFFER_MIN_AGE_DAYS = 7;

export function reviewCoverage(
  loggedDays: number,
  completedWorkouts: number,
): ReviewCoverage {
  if (loggedDays === 0 && completedWorkouts === 0) {
    return "empty";
  }
  if (
    loggedDays < REVIEW_FOOD_DAYS &&
    completedWorkouts < REVIEW_GYM_SESSIONS
  ) {
    return "thin";
  }
  return "ok";
}

export function reviewOfferReady(
  loggedDays: number,
  completedWorkouts: number,
): boolean {
  return reviewCoverage(loggedDays, completedWorkouts) === "ok";
}

export function reviewCtaReady(input: {
  loggedDays: number;
  completedWorkouts: number;
  ageDays: number | null;
}): boolean {
  if (input.ageDays == null || input.ageDays < REVIEW_OFFER_MIN_AGE_DAYS) {
    return false;
  }
  return reviewOfferReady(input.loggedDays, input.completedWorkouts);
}
