import { NEED_ALL_WORKING_WEIGHTS } from "@/lib/messages";
import type { ExerciseWithMax, MaxSource } from "@/lib/types";

export interface StartingPhaseMax {
  exercise_id: string;
  max_weight: number;
  source: MaxSource;
}

/**
 * Starting 1RM for the first phase of a cycle. Only lifts whose plan uses
 * a percent of 1RM must have a max. Linear kg and feel slots are skipped.
 * Missing weights are omitted so the cycle can still start; the session
 * will ask later.
 */
export function resolveStartingPhaseMaxes(
  exercises: ExerciseWithMax[],
  needsMaxIds: Set<string>,
  provided: Array<{ exercise_id: string; max_weight: number }>,
  requireQueueWeights = false,
): StartingPhaseMax[] {
  const byExercise = new Map(
    provided.map((item) => [item.exercise_id, item.max_weight]),
  );

  const resolved: StartingPhaseMax[] = [];
  for (const exercise of exercises) {
    const needsMax = needsMaxIds.has(exercise.id);
    const weight =
      byExercise.get(exercise.id) ??
      (needsMax ? exercise.current_max?.max_weight : null) ??
      null;

    if (weight == null || weight <= 0) {
      if (needsMax && requireQueueWeights) {
        throw new Error(NEED_ALL_WORKING_WEIGHTS);
      }
      continue;
    }

    resolved.push({
      exercise_id: exercise.id,
      max_weight: weight,
      source: "manual",
    });
  }
  return resolved;
}
