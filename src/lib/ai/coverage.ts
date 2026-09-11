import type { ReviewCoverage } from "@/lib/ai/types";

export function reviewCoverage(
  loggedDays: number,
  completedWorkouts: number,
): ReviewCoverage {
  if (loggedDays === 0 && completedWorkouts === 0) {
    return "empty";
  }
  if (loggedDays < 5 && completedWorkouts < 3) {
    return "thin";
  }
  return "ok";
}
