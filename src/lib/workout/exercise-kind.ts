import type { ExerciseWorkoutType, WorkoutKind } from "@/lib/types";

/**
 * Reps or seconds for one exercise. A static exercise is held in any day,
 * a dynamic one is lifted in any day; «both» follows the day.
 */
export function exerciseKind(
  exerciseType: ExerciseWorkoutType,
  dayKind: WorkoutKind,
): WorkoutKind {
  if (exerciseType === "static") {
    return "static";
  }
  if (exerciseType === "both" && dayKind === "static") {
    return "static";
  }
  return "dynamic";
}
