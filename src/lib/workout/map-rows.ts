import { isRecord, mapRecordList } from "@/lib/read";
import type {
  CycleStatus,
  Exercise,
  ExerciseCategory,
  ExerciseProgress,
  ExerciseSlot,
  ExerciseUnit,
  ExerciseWithMax,
  ExerciseWorkoutType,
  FormulaPreset,
  GlobalMax,
  MacroCycle,
  MacroGain,
  MacroRecap,
  MaxSource,
  PhaseMax,
  PhaseMaxRow,
  ProgressPoint,
  SessionExercise,
  SessionStatus,
  StrengthProgress,
  TransitionMaxRow,
  TransitionPreview,
  WorkoutKind,
  WorkoutPhase,
  WorkoutSession,
  WorkoutSet,
} from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";
import {
  toNullableNumber,
  toNullableString,
  toNumber,
} from "@/lib/workout/numbers";

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
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_id: String(row.session_id),
    exercise_id: String(row.exercise_id),
    sort_order: toNumber(row.sort_order),
    max_weight: toNumber(row.max_weight),
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
    planned_seconds: toNullableNumber(row.planned_seconds),
    actual_weight: toNullableNumber(row.actual_weight),
    actual_reps: toNullableNumber(row.actual_reps),
    actual_seconds: toNullableNumber(row.actual_seconds),
    is_completed: Boolean(row.is_completed),
    created_at: String(row.created_at),
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

function toCategory(value: unknown): ExerciseCategory {
  return value === "isolation" ? "isolation" : "base";
}

function toWorkoutType(value: unknown): ExerciseWorkoutType {
  if (value === "dynamic" || value === "static" || value === "both") {
    return value;
  }

  return "dynamic";
}

function toUnit(value: unknown): ExerciseUnit {
  if (value === "reps" || value === "seconds") {
    return value;
  }

  return "reps";
}

function toExerciseSlot(value: unknown): ExerciseSlot | null {
  if (value === "a" || value === "b" || value === "c") {
    return value;
  }

  return null;
}

function toWorkoutKind(value: unknown): WorkoutKind {
  return value === "static" ? "static" : "dynamic";
}

function toSessionStatus(value: unknown): SessionStatus {
  if (value === "completed" || value === "skipped") {
    return value;
  }

  return "planned";
}

export function parseMacroCycle(value: unknown): MacroCycle | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    id: value.id,
    user_id: String(value.user_id ?? ""),
    number: toNumber(value.number),
    start_date: String(value.start_date ?? ""),
    end_date: typeof value.end_date === "string" ? value.end_date : null,
    status: toCycleStatus(value.status),
    note: typeof value.note === "string" ? value.note : null,
    created_at: String(value.created_at ?? ""),
  };
}

export function parseWorkoutPhase(value: unknown): WorkoutPhase | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  if (!isPhaseType(value.phase_type)) {
    return null;
  }

  return {
    id: value.id,
    user_id: String(value.user_id ?? ""),
    macro_cycle_id: String(value.macro_cycle_id ?? ""),
    phase_type: value.phase_type,
    start_date: String(value.start_date ?? ""),
    end_date: typeof value.end_date === "string" ? value.end_date : null,
    status: toCycleStatus(value.status),
    sort_order: toNumber(value.sort_order),
    created_at: String(value.created_at ?? ""),
  };
}

export function parsePhaseMax(value: unknown): PhaseMax | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    id: value.id,
    user_id: String(value.user_id ?? ""),
    phase_id: String(value.phase_id ?? ""),
    exercise_id: String(value.exercise_id ?? ""),
    max_weight: toNumber(value.max_weight),
    source: toMaxSource(value.source),
    set_at: String(value.set_at ?? ""),
    created_at: String(value.created_at ?? ""),
  };
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

export function parseMacroRecap(value: unknown): MacroRecap | null {
  if (!isRecord(value) || typeof value.macro_id !== "string") {
    return null;
  }

  if (!isPhaseType(value.from_phase) || !isPhaseType(value.to_phase)) {
    return null;
  }

  return {
    macro_id: value.macro_id,
    number: toNumber(value.number),
    start_date: String(value.start_date ?? ""),
    end_date: typeof value.end_date === "string" ? value.end_date : null,
    from_phase: value.from_phase,
    to_phase: value.to_phase,
    gains: mapRecordList(value.gains, parseMacroGain),
    grown_count: toNumber(value.grown_count),
    avg_percent: toNullableNumber(value.avg_percent),
  };
}

export function parseTransitionPreview(
  data: unknown,
): TransitionPreview | null {
  const preview = isRecord(data) ? data.preview : null;
  if (!isRecord(preview) || !isPhaseType(preview.from_phase)) {
    return null;
  }

  const toPhase = preview.to_phase;
  if (toPhase != null && !isPhaseType(toPhase)) {
    return null;
  }

  return {
    from_phase: preview.from_phase,
    to_phase: toPhase ?? null,
    new_macro: preview.new_macro === true,
    increased: preview.increased === true,
    maxes: mapRecordList(preview.maxes, parseTransitionMaxRow),
  };
}

export function parseStrengthProgress(data: unknown): StrengthProgress | null {
  if (!isRecord(data) || !Array.isArray(data.exercises)) {
    return null;
  }

  return {
    exercises: mapRecordList(data.exercises, parseExerciseProgress),
    grown_count: toNumber(data.grown_count),
    avg_percent: toNullableNumber(data.avg_percent),
  };
}

function parseMacroGain(row: Record<string, unknown>): MacroGain | null {
  if (typeof row.exercise_id !== "string") {
    return null;
  }

  return {
    exercise_id: row.exercise_id,
    name: String(row.name ?? ""),
    start_weight: toNumber(row.start_weight),
    end_weight: toNumber(row.end_weight),
    delta: toNumber(row.delta),
    percent: toNullableNumber(row.percent),
  };
}

function parseTransitionMaxRow(
  row: Record<string, unknown>,
): TransitionMaxRow | null {
  if (typeof row.exercise_id !== "string") {
    return null;
  }

  return {
    exercise_id: row.exercise_id,
    name: String(row.name ?? ""),
    current_weight: toNumber(row.current_weight),
    proposed_weight: toNumber(row.proposed_weight),
  };
}

function parseExerciseProgress(
  row: Record<string, unknown>,
): ExerciseProgress | null {
  if (typeof row.exercise_id !== "string") {
    return null;
  }

  const category = row.category === "isolation" ? "isolation" : "base";

  return {
    exercise_id: row.exercise_id,
    name: String(row.name ?? ""),
    category,
    current_weight: toNullableNumber(row.current_weight),
    start_weight: toNullableNumber(row.start_weight),
    delta: toNullableNumber(row.delta),
    percent: toNullableNumber(row.percent),
    points: mapRecordList(row.points, parseProgressPoint),
    from_work: row.from_work === true,
  };
}

function parseProgressPoint(
  row: Record<string, unknown>,
): ProgressPoint | null {
  if (typeof row.date !== "string") {
    return null;
  }

  const phaseType = row.phase_type;
  const seconds = toNullableNumber(row.seconds);

  return {
    date: row.date,
    weight: toNumber(row.weight),
    seconds: seconds != null && seconds > 0 ? seconds : null,
    phase_type: isPhaseType(phaseType) ? phaseType : null,
    macro_number: toNullableNumber(row.macro_number),
    label: String(row.label ?? ""),
  };
}

function toCycleStatus(value: unknown): CycleStatus {
  return value === "completed" ? "completed" : "current";
}

function toMaxSource(value: unknown): MaxSource {
  return value === "manual" ? "manual" : "auto";
}
