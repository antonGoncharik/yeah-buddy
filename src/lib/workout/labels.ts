import type {
  CycleStatus,
  ExerciseCategory,
  ExerciseUnit,
  ExerciseWorkoutType,
  PhaseType,
  ScheduleWorkoutType,
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
