import { isRecord, mapRecordList } from "@/lib/read";
import type {
  ExerciseProgress,
  MacroGain,
  MacroRecap,
  ProgressPoint,
  StrengthProgress,
  TransitionMaxRow,
  TransitionPreview,
} from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";
import { phaseLabel } from "@/lib/workout/labels";
import { toNullableNumber, toNumber } from "@/lib/workout/numbers";

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
    from_name:
      typeof value.from_name === "string"
        ? value.from_name
        : phaseLabel(value.from_phase),
    to_name:
      typeof value.to_name === "string"
        ? value.to_name
        : phaseLabel(value.to_phase),
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
    from_name:
      typeof preview.from_name === "string"
        ? preview.from_name
        : phaseLabel(preview.from_phase),
    to_name:
      toPhase == null
        ? null
        : typeof preview.to_name === "string"
          ? preview.to_name
          : phaseLabel(toPhase),
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
    avg_relative_percent: toNullableNumber(data.avg_relative_percent),
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
    current_relative: toNullableNumber(row.current_relative),
    start_relative: toNullableNumber(row.start_relative),
    relative_percent: toNullableNumber(row.relative_percent),
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
    body_weight: toNullableNumber(row.body_weight),
    relative: toNullableNumber(row.relative),
    phase_type: isPhaseType(phaseType) ? phaseType : null,
    macro_number: toNullableNumber(row.macro_number),
    label: String(row.label ?? ""),
  };
}
