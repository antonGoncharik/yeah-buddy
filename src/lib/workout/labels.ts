import type {
  CycleStatus,
  ExerciseCategory,
  ExerciseUnit,
  ExerciseWorkoutType,
  FormulaPreset,
  SessionStatus,
  SetType,
  WorkoutKind,
} from "@/lib/types";

export const EXERCISE_CATEGORIES = ["base", "isolation"] as const;

export const EXERCISE_WORKOUT_TYPES = ["dynamic", "static", "both"] as const;

export const EXERCISE_UNITS = ["reps", "seconds"] as const;

export const FORMULA_PRESETS = ["barbell", "cable", "none"] as const;

export const EXERCISE_SLOTS = ["a", "b", "c"] as const;

export const PHASE_TYPES = ["ramp", "volume", "peak", "deload"] as const;

export type LegacyPhaseKey = (typeof PHASE_TYPES)[number];

export const QUEUE_LABEL = "Очередь";
export const FORMULAS_LABEL = "Схема весов";
export const CYCLE_LABEL = "Цикл";
export const REVIEW_LABEL = "Как прошло";
export const MEAL_TEMPLATES_LABEL = "Еда на день";
export const PACKS_LABEL = "Для друзей";

export function exerciseShortLabel(
  shortName: string | null | undefined,
  name: string,
): string {
  const short = shortName?.trim();
  if (short === "RDL") {
    return "румынская";
  }
  return short || name;
}

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  base: "База",
  isolation: "Изоляция",
};

export const EXERCISE_WORKOUT_TYPE_LABELS: Record<ExerciseWorkoutType, string> =
  {
    dynamic: "Повторы",
    static: "На время",
    both: "И то и то",
  };

export const WORKOUT_KIND_LABELS: Record<WorkoutKind, string> = {
  dynamic: "Повторы",
  static: "На время",
};

export const EXERCISE_UNIT_LABELS: Record<ExerciseUnit, string> = {
  reps: "повторения",
  seconds: "секунды",
};

export const PHASE_TYPE_LABELS: Record<LegacyPhaseKey, string> = {
  ramp: "Разгон",
  volume: "Набор",
  peak: "Рывок",
  deload: "Сброс",
};

export function isLegacyPhaseKey(value: string): value is LegacyPhaseKey {
  return (
    value === "ramp" ||
    value === "volume" ||
    value === "peak" ||
    value === "deload"
  );
}

export function phaseLabel(key: string, name?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (isLegacyPhaseKey(key)) {
    return PHASE_TYPE_LABELS[key];
  }
  return key;
}

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  current: "текущий",
  completed: "завершён",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planned: "В плане",
  completed: "Сделана",
  skipped: "Пропущена",
};

export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: "Разминка",
  work: "Рабочий",
};

export const FORMULA_PRESET_LABELS: Record<FormulaPreset, string> = {
  barbell: "Штанга",
  cable: "Блок",
  none: "Без плана",
};

export const WARMUP_PRESET_IDS = ["barbell", "cable"] as const;

export const WEIGHT_STEP_OPTIONS = [1, 2.5, 5] as const;

export function defaultUnitForWorkoutType(
  workoutType: ExerciseWorkoutType,
): ExerciseUnit {
  return workoutType === "static" ? "seconds" : "reps";
}
