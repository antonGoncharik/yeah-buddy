import { isRecord } from "@/lib/read";
import type {
  Exercise,
  ExerciseWithMax,
  FormulaPreset,
  GlobalMax,
} from "@/lib/types";
import {
  toCategory,
  toExerciseSlot,
  toUnit,
  toWorkoutType,
} from "@/lib/workout/map-enums";
import { toNullableString, toNumber } from "@/lib/workout/numbers";

export function mapExercise(row: Record<string, unknown>): Exercise {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    short_name: toNullableString(row.short_name),
    category: toCategory(row.category),
    workout_type: toWorkoutType(row.workout_type),
    unit: toUnit(row.unit),
    weight_step: toNumber(row.weight_step) || 2.5,
    formula_preset: toPreset(row.formula_preset),
    slot: toExerciseSlot(row.slot),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    archived_at: toNullableString(row.archived_at),
  };
}

export function mapGlobalMax(row: Record<string, unknown>): GlobalMax {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exercise_id: String(row.exercise_id),
    max_weight: toNumber(row.max_weight),
    achieved_at: String(row.achieved_at).slice(0, 10),
    phase_id: toNullableString(row.phase_id),
    workout_session_id: toNullableString(row.workout_session_id),
    created_at: String(row.created_at),
  };
}

export function parseExerciseWithMax(value: unknown): ExerciseWithMax | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  const currentMax = isRecord(value.current_max)
    ? mapGlobalMax(value.current_max)
    : null;
  const history = Array.isArray(value.max_history)
    ? value.max_history.filter(isRecord).map(mapGlobalMax)
    : [];

  return {
    ...mapExercise(value),
    current_max: currentMax,
    max_history: history,
  };
}

export function toPreset(value: unknown): FormulaPreset {
  if (value === "cable_short") {
    return "cable";
  }

  if (value === "barbell" || value === "cable" || value === "none") {
    return value;
  }

  return "barbell";
}

export function isFormulaPreset(value: string): value is FormulaPreset {
  return value === "barbell" || value === "cable" || value === "none";
}
