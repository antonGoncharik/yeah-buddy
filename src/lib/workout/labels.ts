import type {
  CycleStatus,
  ExerciseCategory,
  ExerciseSlot,
  ExerciseUnit,
  ExerciseWorkoutType,
  FormulaPreset,
  PhaseType,
  ScheduleWorkoutType,
  SessionStatus,
  SetType,
  WorkoutKind,
  WorkoutSlot,
} from "@/lib/types";

export const EXERCISE_CATEGORIES = [
  "base",
  "armwrestling",
  "isolation",
] as const;

export const EXERCISE_WORKOUT_TYPES = ["dynamic", "static", "both"] as const;

export const EXERCISE_UNITS = ["reps", "seconds"] as const;

export const FORMULA_PRESETS = [
  "barbell",
  "cable",
  "cable_short",
  "none",
] as const;

export const EXERCISE_SLOTS = ["a", "b", "c"] as const;

export const WORKOUT_SLOTS = ["a", "static", "b", "c"] as const;

export const SLOT_ROTATION = ["a", "static", "b", "c"] as const;

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

export const SCHEDULE_TYPE_LABELS: Record<ScheduleWorkoutType, string> = {
  dynamic: "Динамика",
  static: "Статика",
  rest: "Отдых",
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

export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: "Разминка",
  work: "Рабочий",
};

export const FORMULA_PRESET_LABELS: Record<FormulaPreset, string> = {
  barbell: "Штанга",
  cable: "Блок",
  cable_short: "Короткий блок",
  none: "Без разминки",
};

export const EXERCISE_SLOT_LABELS: Record<ExerciseSlot, string> = {
  a: "Ноги и жим сидя",
  b: "Жимы и тяги",
  c: "Арм",
};

export const WORKOUT_SLOT_LABELS: Record<WorkoutSlot, string> = {
  a: "Ноги и жим сидя",
  b: "Жимы и тяги",
  c: "Арм",
  static: "Статика",
};

export const WEIGHT_STEP_OPTIONS = [1, 2.5, 5] as const;

export const WEEKDAY_LABELS: Record<number, string> = {
  1: "ПН",
  2: "ВТ",
  3: "СР",
  4: "ЧТ",
  5: "ПТ",
  6: "СБ",
  7: "ВС",
};

export const WEEKDAY_FULL_LABELS: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

export function defaultUnitForWorkoutType(
  workoutType: ExerciseWorkoutType,
): ExerciseUnit {
  return workoutType === "static" ? "seconds" : "reps";
}
