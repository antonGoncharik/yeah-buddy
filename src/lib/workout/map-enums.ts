import type {
  CycleStatus,
  ExerciseCategory,
  ExerciseSlot,
  ExerciseUnit,
  ExerciseWorkoutType,
  MaxSource,
  PhaseType,
  SessionFeel,
  SessionStatus,
  WorkoutKind,
} from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";

export function toCategory(value: unknown): ExerciseCategory {
  return value === "isolation" ? "isolation" : "base";
}

export function toWorkoutType(value: unknown): ExerciseWorkoutType {
  if (value === "dynamic" || value === "static" || value === "both") {
    return value;
  }

  return "dynamic";
}

export function toUnit(value: unknown): ExerciseUnit {
  if (value === "reps" || value === "seconds") {
    return value;
  }

  return "reps";
}

export function toExerciseSlot(value: unknown): ExerciseSlot | null {
  if (value === "a" || value === "b" || value === "c") {
    return value;
  }

  return null;
}

export function toWorkoutKind(value: unknown): WorkoutKind {
  return value === "static" ? "static" : "dynamic";
}

export function toSessionStatus(value: unknown): SessionStatus {
  if (value === "completed" || value === "skipped") {
    return value;
  }

  return "planned";
}

export function toSessionFeel(value: unknown): SessionFeel | null {
  if (value === "easy" || value === "close" || value === "miss") {
    return value;
  }

  return null;
}

export function toCycleStatus(value: unknown): CycleStatus {
  return value === "completed" ? "completed" : "current";
}

export function toPhaseType(value: unknown): PhaseType {
  return isPhaseType(value) ? value : "ramp";
}

export function toMaxSource(value: unknown): MaxSource {
  return value === "manual" ? "manual" : "auto";
}
