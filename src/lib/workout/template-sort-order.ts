import type { WorkoutTemplateDetail } from "@/lib/types";

/** Sort order from template exercise list; falls back when exercise is not in the template. */
export function templateExerciseSortOrder(
  template: Pick<WorkoutTemplateDetail, "exercises"> | null,
  exerciseId: string,
  fallback: number,
): number {
  if (!template) {
    return fallback;
  }
  const index = template.exercises.findIndex(
    (exercise) => exercise.id === exerciseId,
  );
  if (index < 0) {
    return fallback;
  }
  return (index + 1) * 10;
}
