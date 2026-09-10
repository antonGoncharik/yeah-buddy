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

function times(spec: FormulaSetSpec, count: number): FormulaSetSpec[] {
  return Array.from({ length: count }, () => ({ ...spec }));
}

function phasePack(
  work: FormulaSetSpec[],
  volumeWork: FormulaSetSpec[] = work,
): Record<PhaseType, FormulaPhaseSpec> {
  return {
    ramp: { warmup: [], work },
    volume: { warmup: [], work: volumeWork },
    peak: { warmup: [], work },
    deload: { warmup: [], work: DYNAMIC_DELOAD },
  };
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

const DYNAMIC_DELOAD = times(reps(60, 5), 3);

const STATIC_PHASES: Record<PhaseType, FormulaPhaseSpec> = {
  ramp: { warmup: [], work: times(seconds(115, 6), 3) },
  volume: {
    warmup: [],
    work: [seconds(115, 8), seconds(115, 6), seconds(115, 6)],
  },
  peak: { warmup: [], work: times(seconds(115, 6), 3) },
  deload: { warmup: [], work: times(seconds(50, 3), 2) },
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

function pack(
  work: FormulaSetSpec[],
  volumeWork?: FormulaSetSpec[],
): WorkoutFormulas {
  return {
    dynamic: phasePack(work, volumeWork ?? work),
    static: STATIC_PHASES,
    warmups: DEFAULT_WARMUP_PRESETS,
  };
}

const SIMPLE_WORK = times(reps(80, 5), 3);

export const SIMPLE_WORKOUT_FORMULAS: WorkoutFormulas = pack(SIMPLE_WORK);

export const FIVE_BY_FIVE_FORMULAS: WorkoutFormulas = pack(
  times(reps(80, 5), 5),
);

export const VOLUME_WORKOUT_FORMULAS: WorkoutFormulas = pack(
  times(reps(70, 8), 3),
  times(reps(70, 10), 3),
);

export const PYRAMID_WORKOUT_FORMULAS: WorkoutFormulas = pack(
  [reps(80, 5), reps(75, 6), reps(70, 8)],
  [reps(75, 8), reps(70, 10), reps(65, 12)],
);

/** Default for new users. Already saved settings are not overwritten. */
export const DEFAULT_WORKOUT_FORMULAS: WorkoutFormulas =
  SIMPLE_WORKOUT_FORMULAS;

export const FORMULA_SYSTEM_IDS = [
  "simple",
  "five_by_five",
  "volume",
  "pyramid",
] as const;

export type FormulaSystemId = (typeof FORMULA_SYSTEM_IDS)[number];

export const FORMULA_SYSTEMS: Array<{
  id: FormulaSystemId;
  name: string;
  hint: string;
  formulas: WorkoutFormulas;
}> = [
  {
    id: "simple",
    name: "3×5",
    hint: "Три рабочих по 5 на 80%. Сброс лёгкий. Удержания — как обычно.",
    formulas: SIMPLE_WORKOUT_FORMULAS,
  },
  {
    id: "five_by_five",
    name: "5×5",
    hint: "Пять рабочих по 5 на 80%. Сброс лёгкий.",
    formulas: FIVE_BY_FIVE_FORMULAS,
  },
  {
    id: "volume",
    name: "3×8",
    hint: "Три рабочих по 8 на 70%. В наборе — по 10.",
    formulas: VOLUME_WORKOUT_FORMULAS,
  },
  {
    id: "pyramid",
    name: "Пирамида",
    hint: "80×5 / 75×6 / 70×8. В наборе чуть легче и больше повторов.",
    formulas: PYRAMID_WORKOUT_FORMULAS,
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
