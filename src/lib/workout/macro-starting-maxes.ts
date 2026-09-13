import { NEED_ALL_WORKING_WEIGHTS } from "@/lib/messages";
import type { ExerciseWithMax, MaxSource } from "@/lib/types";

export interface StartingPhaseMax {
  exercise_id: string;
  max_weight: number;
  source: MaxSource;
}

/**
 * Starting weights for the first phase of a cycle. Exercises in the queue must
 * have a weight: from the form, or the current working weight as a fallback.
 * Other exercises get a phase max only when the form provided one.
 */
export function resolveStartingPhaseMaxes(
  exercises: ExerciseWithMax[],
  queueExerciseIds: Set<string>,
  provided: Array<{ exercise_id: string; max_weight: number }>,
): StartingPhaseMax[] {
  const byExercise = new Map(
    provided.map((item) => [item.exercise_id, item.max_weight]),
  );

  return exercises.flatMap((exercise) => {
    const inQueue =
      queueExerciseIds.has(exercise.id) && exercise.formula_preset !== "none";
    const weight =
      byExercise.get(exercise.id) ??
      (inQueue ? exercise.current_max?.max_weight : null) ??
      null;

    if (weight == null || weight <= 0) {
      if (inQueue) {
        throw new Error(NEED_ALL_WORKING_WEIGHTS);
      }
      return [];
    }

    return [{ exercise_id: exercise.id, max_weight: weight, source: "manual" }];
  });
}
