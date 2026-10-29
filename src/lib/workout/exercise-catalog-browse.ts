import type { ExerciseWithMax } from "@/lib/types";
import { foldExerciseName } from "@/lib/workout/muscle-catalog-map";

export function exerciseCatalogSearchNeedle(query: string): string {
  return foldExerciseName(query);
}

export function exerciseMatchesCatalogSearch(
  exercise: ExerciseWithMax,
  needle: string,
): boolean {
  if (needle === "") {
    return true;
  }
  return foldExerciseName(
    `${exercise.name} ${exercise.short_name ?? ""}`,
  ).includes(needle);
}

/** Active-only when not searching; with 1RM first when browsing. */
export function filterExercisesForCatalogBrowse(
  available: ExerciseWithMax[],
  query: string,
): ExerciseWithMax[] {
  const needle = exerciseCatalogSearchNeedle(query);
  const pool = needle
    ? available
    : available.filter((exercise) => exercise.is_active);
  const matches = needle
    ? pool.filter((exercise) => exerciseMatchesCatalogSearch(exercise, needle))
    : pool;
  return sortExercisesWithMaxFirst(matches);
}

export function sortExercisesWithMaxFirst(
  exercises: ExerciseWithMax[],
): ExerciseWithMax[] {
  return [...exercises].sort((a, b) => {
    const aMax = a.current_max?.max_weight ?? 0;
    const bMax = b.current_max?.max_weight ?? 0;
    if (aMax > 0 !== bMax > 0) {
      return aMax > 0 ? -1 : 1;
    }
    return 0;
  });
}
