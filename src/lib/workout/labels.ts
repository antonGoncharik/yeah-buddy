import type {
  CycleStatus,
  ExerciseCategory,
  ExerciseUnit,
  ExerciseWorkoutType,
  FormulaPreset,
  PhaseType,
  SessionKind,
  SessionStatus,
  SetType,
  WorkoutKind,
} from "@/lib/types";

export const EXERCISE_CATEGORIES = [
  "base",
  "armwrestling",
  "isolation",
] as const;

export const EXERCISE_WORKOUT_TYPES = ["dynamic", "static", "both"] as const;

export const EXERCISE_UNITS = ["reps", "seconds"] as const;

export const FORMULA_PRESETS = ["barbell", "cable", "none"] as const;

export const EXERCISE_SLOTS = ["a", "b", "c"] as const;

export const PHASE_TYPES = ["ramp", "volume", "peak", "deload"] as const;

export const PHASE_ORDER: Record<PhaseType, number> = {
  ramp: 1,
  volume: 2,
  peak: 3,
  deload: 4,
};

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  base: "База",
  armwrestling: "Армрестлинг",
  isolation: "Изоляция",
};

export const EXERCISE_WORKOUT_TYPE_LABELS: Record<ExerciseWorkoutType, string> =
  {
    dynamic: "Динамика",
    static: "Статика",
    both: "Оба",
  };

export const WORKOUT_KIND_LABELS: Record<WorkoutKind, string> = {
  dynamic: "Динамика",
  static: "Статика",
};

export const EXERCISE_UNIT_LABELS: Record<ExerciseUnit, string> = {
  reps: "повторения",
  seconds: "секунды",
};

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  ramp: "Разгон",
  volume: "Набор",
  peak: "Рывок",
  deload: "Сброс",
};

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  current: "текущий",
  completed: "завершён",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planned: "В плане",
  completed: "Сделана",
  skipped: "Пропущена",
};

export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  gym: "Зал",
  table: "Стол",
};

export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: "Разминка",
  work: "Рабочий",
};

export const FORMULA_PRESET_LABELS: Record<FormulaPreset, string> = {
  barbell: "Штанга",
  cable: "Блок",
  none: "Не в план",
};

export const WARMUP_PRESET_IDS = ["barbell", "cable"] as const;

export const WEIGHT_STEP_OPTIONS = [1, 2.5, 5] as const;

export function defaultUnitForWorkoutType(
  workoutType: ExerciseWorkoutType,
): ExerciseUnit {
  return workoutType === "static" ? "seconds" : "reps";
}
