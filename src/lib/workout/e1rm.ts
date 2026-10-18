/** Epley uses at most 12 effective reps (reps + RIR); above that the estimate stays conservative. */
const MAX_EFFECTIVE_REPS = 12;

export function effectiveReps(
  reps: number | null,
  rir: number | null = 0,
): number | null {
  if (reps == null || reps <= 0) {
    return null;
  }
  const reserve = rir != null && rir > 0 ? rir : 0;
  const total = reps + reserve;
  if (total <= 0) {
    return null;
  }
  return Math.min(total, MAX_EFFECTIVE_REPS);
}

/** Epley-style estimate from weight and reps (+ optional RIR). */
export function estimateE1rm(
  weight: number,
  reps: number | null,
  rir: number | null = 0,
): number | null {
  if (!(weight > 0)) {
    return null;
  }
  const effective = effectiveReps(reps, rir);
  if (effective == null) {
    return weight;
  }
  if (effective <= 1) {
    return weight;
  }
  return weight * (1 + effective / 30);
}

export function e1rmFromWorkSet(set: {
  set_type: string;
  planned_weight: number | null;
  actual_weight: number | null;
  planned_reps: number | null;
  actual_reps: number | null;
  planned_rir?: number | null;
  actual_rir?: number | null;
}): number | null {
  if (set.set_type !== "work") {
    return null;
  }
  const weight = set.actual_weight ?? set.planned_weight;
  if (weight == null || weight <= 0) {
    return null;
  }
  const reps = set.actual_reps ?? set.planned_reps;
  if (reps == null || reps <= 0) {
    return null;
  }
  return estimateE1rm(weight, reps, rirForEstimate(set));
}

/**
 * A planned reserve belongs to the planned set. Once the weight or the reps
 * were changed and no actual reserve was logged, counting it would invent
 * reps that were not done.
 */
function rirForEstimate(set: {
  planned_weight: number | null;
  actual_weight: number | null;
  planned_reps: number | null;
  actual_reps: number | null;
  planned_rir?: number | null;
  actual_rir?: number | null;
}): number | null {
  if (set.actual_rir != null) {
    return set.actual_rir;
  }
  const weightChanged =
    set.actual_weight != null && set.actual_weight !== set.planned_weight;
  const repsChanged =
    set.actual_reps != null && set.actual_reps !== set.planned_reps;
  if (weightChanged || repsChanged) {
    return 0;
  }
  return set.planned_rir ?? null;
}
