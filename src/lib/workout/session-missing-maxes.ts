import type { Exercise } from "@/lib/types";
import { estimateE1rm } from "@/lib/workout/e1rm";
import { floorToStep } from "@/lib/workout/formulas";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export type MissingMaxEntry = {
  exercise_id: string;
  max_weight: number;
};

export function missingMaxStep(exercise: Exercise): number {
  return exercise.weight_step > 0 ? exercise.weight_step : 2.5;
}

export function estimateMissingMaxRounded(
  exercise: Exercise,
  weight: number,
  reps: number,
): number | null {
  const estimated = estimateE1rm(weight, reps, null);
  if (estimated == null || !(estimated > 0)) {
    return null;
  }
  return floorToStep(estimated, missingMaxStep(exercise));
}

export function buildMissingMaxEntries(
  exercises: Exercise[],
  oneRm: Record<string, string>,
  workKg: Record<string, string>,
  workReps: Record<string, string>,
): MissingMaxEntry[] {
  return exercises.flatMap((exercise) => {
    const direct = parseDecimal(oneRm[exercise.id] ?? "");
    if (direct != null && direct > 0) {
      return [{ exercise_id: exercise.id, max_weight: direct }];
    }
    const weight = parseDecimal(workKg[exercise.id] ?? "");
    const reps = Number.parseInt(workReps[exercise.id] ?? "", 10);
    if (
      weight == null ||
      weight <= 0 ||
      !Number.isFinite(reps) ||
      reps < 1 ||
      reps > 30
    ) {
      return [];
    }
    const rounded = estimateMissingMaxRounded(exercise, weight, reps);
    if (rounded == null) {
      return [];
    }
    return [{ exercise_id: exercise.id, max_weight: rounded }];
  });
}

export function formatMissingMaxEstimateLine(
  exercise: Exercise,
  workKg: Record<string, string>,
  workReps: Record<string, string>,
): string | null {
  const weight = parseDecimal(workKg[exercise.id] ?? "");
  const reps = Number.parseInt(workReps[exercise.id] ?? "", 10);
  if (weight == null || weight <= 0 || !Number.isFinite(reps) || reps < 1) {
    return null;
  }
  const rounded = estimateMissingMaxRounded(exercise, weight, reps);
  if (rounded == null) {
    return null;
  }
  return `≈ ${formatWeight(rounded)} кг на раз`;
}
