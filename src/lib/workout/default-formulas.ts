import type {
  FormulaPhaseSpec,
  FormulaSetSpec,
  PhaseType,
  WarmupPresetId,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";

function reps(percent: number, count: number): FormulaSetSpec {
  return { percent, reps: count, seconds: null };
}

function seconds(percent: number, count: number): FormulaSetSpec {
  return { percent, reps: null, seconds: count };
}

export const BARBELL_WARMUP: FormulaSetSpec[] = [
  reps(50, 5),
  reps(70, 3),
  reps(80, 1),
];

export const CABLE_WARMUP: FormulaSetSpec[] = [reps(50, 5), reps(70, 3)];

const DYNAMIC_WORK_RAMP = [reps(88, 3), reps(82, 5), reps(76, 7)];
const DYNAMIC_WORK_VOLUME = [reps(88, 5), reps(82, 5), reps(76, 7)];
const DYNAMIC_DELOAD = [reps(60, 5), reps(60, 5), reps(60, 5)];

const STATIC_WORK_RAMP = [seconds(115, 6), seconds(115, 6), seconds(115, 6)];
const STATIC_WORK_VOLUME = [seconds(115, 8), seconds(115, 6), seconds(115, 6)];
const STATIC_DELOAD = [seconds(50, 3), seconds(50, 3)];

const DYNAMIC_PHASES: Record<PhaseType, FormulaPhaseSpec> = {
  ramp: { warmup: BARBELL_WARMUP, work: DYNAMIC_WORK_RAMP },
  volume: { warmup: BARBELL_WARMUP, work: DYNAMIC_WORK_VOLUME },
  peak: { warmup: BARBELL_WARMUP, work: DYNAMIC_WORK_RAMP },
  deload: { warmup: [], work: DYNAMIC_DELOAD },
};

const STATIC_PHASES: Record<PhaseType, FormulaPhaseSpec> = {
  ramp: { warmup: [], work: STATIC_WORK_RAMP },
  volume: { warmup: [], work: STATIC_WORK_VOLUME },
  peak: { warmup: [], work: STATIC_WORK_RAMP },
  deload: { warmup: [], work: STATIC_DELOAD },
};

export const DEFAULT_WARMUP_PRESETS: Record<WarmupPresetId, FormulaSetSpec[]> =
  {
    barbell: BARBELL_WARMUP,
    cable: CABLE_WARMUP,
  };

export const DEFAULT_WORKOUT_FORMULAS: WorkoutFormulas = {
  dynamic: DYNAMIC_PHASES,
  static: STATIC_PHASES,
  warmups: DEFAULT_WARMUP_PRESETS,
};

export function cloneFormulas(formulas: WorkoutFormulas): WorkoutFormulas {
  return structuredClone(formulas);
}

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
