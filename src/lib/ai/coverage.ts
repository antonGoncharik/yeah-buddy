import type { ReviewCoverage } from "@/lib/ai/types";

export const REVIEW_FOOD_DAYS = 7;
export const REVIEW_GYM_SESSIONS = 4;

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
