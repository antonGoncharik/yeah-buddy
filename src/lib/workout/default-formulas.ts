import type {
  FormulaPhaseSpec,
  FormulaSetSpec,
  PhaseType,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";

function reps(percent: number, count: number): FormulaSetSpec {
  return { percent, reps: count, seconds: null };
}

function seconds(percent: number, count: number): FormulaSetSpec {
  return { percent, reps: null, seconds: count };
}

const DYNAMIC_WARMUP: FormulaSetSpec[] = [
  reps(50, 5),
  reps(70, 3),
  reps(80, 1),
];

const STATIC_WARMUP: FormulaSetSpec[] = [
  seconds(50, 10),
  seconds(80, 5),
  seconds(100, 5),
];

const DYNAMIC_PHASES: Record<PhaseType, FormulaPhaseSpec> = {
  ramp: {
    warmup: DYNAMIC_WARMUP,
    work: [reps(87.5, 3), reps(80, 5), reps(72.5, 7)],
  },
  volume: {
    warmup: DYNAMIC_WARMUP,
    work: [reps(87.5, 5), reps(80, 5), reps(72.5, 7)],
  },
  peak: {
    warmup: DYNAMIC_WARMUP,
    work: [reps(87.5, 3), reps(80, 5), reps(72.5, 7)],
  },
  deload: {
    warmup: [],
    work: [reps(59, 5), reps(59, 5), reps(59, 5)],
  },
};

const STATIC_PHASES: Record<PhaseType, FormulaPhaseSpec> = {
  ramp: {
    warmup: STATIC_WARMUP,
    work: [seconds(114, 6), seconds(114, 6), seconds(114, 6)],
  },
  volume: {
    warmup: STATIC_WARMUP,
    work: [seconds(114, 8), seconds(114, 6), seconds(114, 6)],
  },
  peak: {
    warmup: STATIC_WARMUP,
    work: [seconds(114, 6), seconds(114, 6), seconds(114, 6)],
  },
  deload: {
    warmup: [],
    work: [seconds(50, 3), seconds(50, 3), seconds(50, 3)],
  },
};

export const DEFAULT_WORKOUT_FORMULAS: WorkoutFormulas = {
  dynamic: DYNAMIC_PHASES,
  static: STATIC_PHASES,
};

export function isWorkoutKind(value: unknown): value is WorkoutKind {
  return value === "dynamic" || value === "static";
}

export function isPhaseType(value: unknown): value is PhaseType {
  return (
    value === "ramp" ||
    value === "volume" ||
    value === "peak" ||
    value === "deload"
  );
}
