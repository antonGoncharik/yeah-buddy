export function workTonnage(
  sets: Array<{
    set_type?: string;
    actual_weight: number | null;
    planned_weight: number | null;
    actual_reps: number | null;
    planned_reps: number | null;
  }>,
): number | null {
  let sum = 0;
  let counted = false;
  for (const set of sets) {
    if (set.set_type != null && set.set_type !== "work") {
      continue;
    }
    const weight = set.actual_weight ?? set.planned_weight;
    const reps = set.actual_reps ?? set.planned_reps;
    if (weight == null || weight <= 0 || reps == null || reps <= 0) {
      continue;
    }
    sum += weight * reps;
    counted = true;
  }

  return counted ? sum : null;
}

export function circleTonnageByRound(
  points: Array<{
    sessionIndex: number;
    exerciseId: string;
    tonnage: number | null;
  }>,
  circleSize: number,
): Array<number | null> {
  const size = Math.max(circleSize, 1);
  const sums = new Map<string, number>();
  for (const point of points) {
    if (point.tonnage == null) {
      continue;
    }
    const key = roundKey(point.exerciseId, point.sessionIndex, size);
    sums.set(key, (sums.get(key) ?? 0) + point.tonnage);
  }

  return points.map((point) => {
    if (point.tonnage == null) {
      return null;
    }
    return (
      sums.get(roundKey(point.exerciseId, point.sessionIndex, size)) ?? null
    );
  });
}

function roundKey(
  exerciseId: string,
  sessionIndex: number,
  circleSize: number,
): string {
  return `${exerciseId}:${Math.floor(sessionIndex / circleSize)}`;
}
