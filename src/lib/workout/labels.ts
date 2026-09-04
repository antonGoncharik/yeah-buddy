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
  base: "база",
  armwrestling: "армрестлинг",
  isolation: "изоляция",
};

export const EXERCISE_WORKOUT_TYPE_LABELS: Record<ExerciseWorkoutType, string> =
  {
    dynamic: "динамика",
    static: "статика",
    both: "оба",
  };

export const WORKOUT_KIND_LABELS: Record<WorkoutKind, string> = {
  dynamic: "динамика",
  static: "статика",
};

export const SCHEDULE_TYPE_LABELS: Record<ScheduleWorkoutType, string> = {
  dynamic: "динамика",
  static: "статика",
  rest: "отдых",
};

export const EXERCISE_UNIT_LABELS: Record<ExerciseUnit, string> = {
  reps: "повторения",
  seconds: "секунды",
};

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  ramp: "разгон",
  volume: "набор",
  peak: "рывок",
  deload: "сброс",
};

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  current: "текущий",
  completed: "завершён",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planned: "запланирована",
  completed: "выполнена",
  skipped: "пропущена",
};

export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: "разминка",
  work: "рабочий",
};

export const FORMULA_PRESET_LABELS: Record<FormulaPreset, string> = {
  barbell: "штанга · 3 разминочных",
  cable: "блок · 2 разминочных",
  cable_short: "блок · короткая разминка",
  none: "без процентов",
};

export const EXERCISE_SLOT_LABELS: Record<ExerciseSlot, string> = {
  a: "A · ноги и жим сидя",
  b: "B · жимы и тяги",
  c: "C · арм",
};

export const WORKOUT_SLOT_LABELS: Record<WorkoutSlot, string> = {
  a: "A · ноги и жим сидя",
  b: "B · жимы и тяги",
  c: "C · арм динамика",
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
