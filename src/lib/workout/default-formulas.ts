import type {
  FormulaPhaseSpec,
  FormulaSetSpec,
  KindWarmups,
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

export const BARBELL_WARMUP: FormulaSetSpec[] = [
  reps(50, 5),
  reps(70, 3),
  reps(80, 1),
];

export const CABLE_WARMUP: FormulaSetSpec[] = [reps(50, 5), reps(70, 3)];

export const STATIC_BARBELL_WARMUP: FormulaSetSpec[] = [
  reps(50, 5),
  reps(70, 3),
  seconds(100, 2),
];

export const STATIC_CABLE_WARMUP: FormulaSetSpec[] = [
  reps(50, 5),
  reps(70, 3),
  seconds(100, 2),
];

const DYNAMIC_WORK_RAMP = [reps(88, 3), reps(82, 5), reps(76, 7)];
const DYNAMIC_WORK_VOLUME = [reps(88, 5), reps(82, 5), reps(76, 7)];
const DYNAMIC_DELOAD = [reps(60, 5), reps(60, 5), reps(60, 5)];

const STATIC_WORK_RAMP = [seconds(115, 6), seconds(115, 6), seconds(115, 6)];
const STATIC_WORK_VOLUME = [seconds(115, 8), seconds(115, 6), seconds(115, 6)];
const STATIC_DELOAD = [seconds(50, 3), seconds(50, 3)];

const DYNAMIC_PHASES: Record<PhaseType, FormulaPhaseSpec> = {
  ramp: { warmup: [], work: DYNAMIC_WORK_RAMP },
  volume: { warmup: [], work: DYNAMIC_WORK_VOLUME },
  peak: { warmup: [], work: DYNAMIC_WORK_RAMP },
  deload: { warmup: [], work: DYNAMIC_DELOAD },
};

const STATIC_PHASES: Record<PhaseType, FormulaPhaseSpec> = {
  ramp: { warmup: [], work: STATIC_WORK_RAMP },
  volume: { warmup: [], work: STATIC_WORK_VOLUME },
  peak: { warmup: [], work: STATIC_WORK_RAMP },
  deload: { warmup: [], work: STATIC_DELOAD },
};

const DYNAMIC_WARMUPS: KindWarmups = {
  barbell: BARBELL_WARMUP,
  cable: CABLE_WARMUP,
};

const STATIC_WARMUPS: KindWarmups = {
  barbell: STATIC_BARBELL_WARMUP,
  cable: STATIC_CABLE_WARMUP,
};

export const DEFAULT_WARMUP_PRESETS: Record<WorkoutKind, KindWarmups> = {
  dynamic: DYNAMIC_WARMUPS,
  static: STATIC_WARMUPS,
};

export const DEFAULT_WORKOUT_FORMULAS: WorkoutFormulas = {
  dynamic: DYNAMIC_PHASES,
  static: STATIC_PHASES,
  warmups: DEFAULT_WARMUP_PRESETS,
};

const SIMPLE_DYNAMIC_WORK = [reps(80, 5), reps(80, 5), reps(80, 5)];

export const SIMPLE_WORKOUT_FORMULAS: WorkoutFormulas = {
  dynamic: {
    ramp: { warmup: [], work: SIMPLE_DYNAMIC_WORK },
    volume: { warmup: [], work: SIMPLE_DYNAMIC_WORK },
    peak: { warmup: [], work: SIMPLE_DYNAMIC_WORK },
    deload: { warmup: [], work: DYNAMIC_DELOAD },
  },
  static: STATIC_PHASES,
  warmups: DEFAULT_WARMUP_PRESETS,
};

export const FORMULA_SYSTEMS: Array<{
  id: "classic" | "simple";
  name: string;
  hint: string;
  formulas: WorkoutFormulas;
}> = [
  {
    id: "classic",
    name: "Классика",
    hint: "Разгон и рывок 3–5–7, набор чуть больше объёма. Статика — удержания, в разминке 2 с на рабочем весе.",
    formulas: DEFAULT_WORKOUT_FORMULAS,
  },
  {
    id: "simple",
    name: "3×5",
    hint: "Три рабочих по 5 на 80%. Сброс лёгкий. Статика как в классике.",
    formulas: SIMPLE_WORKOUT_FORMULAS,
  },
];

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
