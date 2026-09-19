import { isRecord } from "@/lib/read";
import type { SessionExercise, WorkoutSession, WorkoutSet } from "@/lib/types";
import {
  toSessionFeel,
  toSessionStatus,
  toSlotIntensity,
  toWorkoutKind,
} from "@/lib/workout/map-enums";
import {
  toNullableNumber,
  toNullableString,
  toNumber,
} from "@/lib/workout/numbers";

export function mapWorkoutSession(
  row: Record<string, unknown>,
): WorkoutSession {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_date: String(row.session_date).slice(0, 10),
    macro_cycle_id: toNullableString(row.macro_cycle_id),
    phase_id: toNullableString(row.phase_id),
    workout_type: toWorkoutKind(row.workout_type),
    template_id: toNullableString(row.template_id),
    status: toSessionStatus(row.status),
    note: toNullableString(row.note),
    feel: toSessionFeel(row.feel),
    created_at: String(row.created_at),
  };
}

export function parseWorkoutSession(value: unknown): WorkoutSession | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapWorkoutSession(value);
}

export function mapSessionExercise(
  row: Record<string, unknown>,
): SessionExercise {
  const maxWeight = toNullableNumber(row.max_weight);
  const trackStep = toNullableNumber(row.track_step);
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_id: String(row.session_id),
    exercise_id: String(row.exercise_id),
    sort_order: toNumber(row.sort_order),
    max_weight: maxWeight != null && maxWeight > 0 ? maxWeight : null,
    intensity: toSlotIntensity(row.intensity),
    note: toNullableString(row.note),
    track_id: toNullableString(row.track_id),
    track_step: trackStep != null && trackStep >= 0 ? trackStep : null,
    created_at: String(row.created_at),
  };
}

export function mapWorkoutSet(row: Record<string, unknown>): WorkoutSet {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_exercise_id: String(row.session_exercise_id),
    set_type: row.set_type === "work" ? "work" : "warmup",
    set_number: toNumber(row.set_number),
    planned_weight: toNullableNumber(row.planned_weight),
    planned_reps: toNullableNumber(row.planned_reps),
    planned_reps_to: toNullableNumber(row.planned_reps_to),
    planned_seconds: toNullableNumber(row.planned_seconds),
    planned_rir: toNullableNumber(row.planned_rir),
    actual_weight: toNullableNumber(row.actual_weight),
    actual_reps: toNullableNumber(row.actual_reps),
    actual_seconds: toNullableNumber(row.actual_seconds),
    actual_rir: toNullableNumber(row.actual_rir),
    is_completed: Boolean(row.is_completed),
    logged: row.logged === true,
    created_at: String(row.created_at),
  };
}
