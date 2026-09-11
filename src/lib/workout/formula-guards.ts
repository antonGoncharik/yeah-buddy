import type { PhaseType, WorkoutFormulas, WorkoutKind } from "@/lib/types";

export function cloneFormulas(formulas: WorkoutFormulas): WorkoutFormulas {
  return structuredClone(formulas);
}

export function isWorkoutKind(value: unknown): value is WorkoutKind {
  return value === "dynamic" || value === "static";
}

export function isPhaseType(value: unknown): value is PhaseType {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= 40
  );
}
