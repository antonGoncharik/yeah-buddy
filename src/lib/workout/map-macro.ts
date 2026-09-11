import { isRecord } from "@/lib/read";
import type {
  MacroCycle,
  PhaseMax,
  PhaseMaxRow,
  WorkoutPhase,
} from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";
import {
  toCycleStatus,
  toMaxSource,
  toPhaseType,
} from "@/lib/workout/map-enums";
import { parseExerciseWithMax } from "@/lib/workout/map-exercise";
import {
  toNullableNumber,
  toNullableString,
  toNumber,
} from "@/lib/workout/numbers";

export function mapMacroCycle(row: Record<string, unknown>): MacroCycle {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    number: toNumber(row.number),
    start_date: String(row.start_date).slice(0, 10),
    end_date: toNullableString(row.end_date)?.slice(0, 10) ?? null,
    status: toCycleStatus(row.status),
    note: toNullableString(row.note),
    created_at: String(row.created_at),
  };
}

export function parseMacroCycle(value: unknown): MacroCycle | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapMacroCycle(value);
}

export function mapWorkoutPhase(row: Record<string, unknown>): WorkoutPhase {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    macro_cycle_id: String(row.macro_cycle_id),
    phase_type: toPhaseType(row.phase_type),
    name: toNullableString(row.name),
    start_date: String(row.start_date).slice(0, 10),
    end_date: toNullableString(row.end_date)?.slice(0, 10) ?? null,
    status: toCycleStatus(row.status),
    sort_order: toNumber(row.sort_order),
    created_at: String(row.created_at),
  };
}

export function parseWorkoutPhase(value: unknown): WorkoutPhase | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  if (!isPhaseType(value.phase_type)) {
    return null;
  }

  return mapWorkoutPhase(value);
}

export function mapPhaseMax(row: Record<string, unknown>): PhaseMax {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    phase_id: String(row.phase_id),
    exercise_id: String(row.exercise_id),
    max_weight: toNumber(row.max_weight),
    source: toMaxSource(row.source),
    set_at: String(row.set_at),
    created_at: String(row.created_at),
  };
}

export function parsePhaseMax(value: unknown): PhaseMax | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapPhaseMax(value);
}

export function parsePhaseMaxRow(
  row: Record<string, unknown>,
): PhaseMaxRow | null {
  const exercise = parseExerciseWithMax(row.exercise);
  if (!exercise) {
    return null;
  }

  return {
    exercise,
    phase_max: parsePhaseMax(row.phase_max),
    proposed_weight: toNullableNumber(row.proposed_weight),
  };
}
