import type { MuscleId } from "@/lib/types";

const SORE_MUSCLE_MIN_SHARE = 0.25;

export function exerciseTouchesSoreMuscles(
  weights: Partial<Record<MuscleId, number>>,
  wanted: ReadonlySet<MuscleId>,
): boolean {
  for (const muscle of wanted) {
    if ((weights[muscle] ?? 0) >= SORE_MUSCLE_MIN_SHARE) {
      return true;
    }
  }
  return false;
}
