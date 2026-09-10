import type {
  CyclePhaseDef,
  FormulaSetSpec,
  KindFormulas,
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

export const DYNAMIC_DELOAD: FormulaSetSpec[] = times(reps(60, 5), 3);

export const STATIC_BASE_WORK: FormulaSetSpec[] = times(seconds(115, 6), 3);

export const STATIC_DELOAD: FormulaSetSpec[] = times(seconds(50, 3), 2);

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

function kindFromWork(work: FormulaSetSpec[]): KindFormulas {
  return {
    base: { warmup: [], work },
    phases: {},
  };
}

function pack(work: FormulaSetSpec[]): WorkoutFormulas {
  return {
    dynamic: kindFromWork(work),
    static: kindFromWork(STATIC_BASE_WORK),
    warmups: DEFAULT_WARMUP_PRESETS,
    cycle: [],
  };
}

const SIMPLE_WORK = times(reps(80, 5), 3);

export const SIMPLE_WORKOUT_FORMULAS: WorkoutFormulas = pack(SIMPLE_WORK);

export const FIVE_BY_FIVE_FORMULAS: WorkoutFormulas = pack(
  times(reps(80, 5), 5),
);

export const VOLUME_WORKOUT_FORMULAS: WorkoutFormulas = pack(
  times(reps(70, 8), 3),
);

export const PYRAMID_WORKOUT_FORMULAS: WorkoutFormulas = pack([
  reps(80, 5),
  reps(75, 6),
  reps(70, 8),
]);

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
    hint: "Три рабочих по 5 на 80%. Без макроцикла — всегда эти подходы.",
    formulas: SIMPLE_WORKOUT_FORMULAS,
  },
  {
    id: "five_by_five",
    name: "5×5",
    hint: "Пять рабочих по 5 на 80%.",
    formulas: FIVE_BY_FIVE_FORMULAS,
  },
  {
    id: "volume",
    name: "3×8",
    hint: "Три рабочих по 8 на 70%.",
    formulas: VOLUME_WORKOUT_FORMULAS,
  },
  {
    id: "pyramid",
    name: "Пирамида",
    hint: "80×5 / 75×6 / 70×8.",
    formulas: PYRAMID_WORKOUT_FORMULAS,
  },
];

export const FOUR_PHASE_CYCLE: CyclePhaseDef[] = [
  { key: "ramp", name: "Разгон", skip_warmup: false, increase_on_end: false },
  { key: "volume", name: "Набор", skip_warmup: false, increase_on_end: true },
  { key: "peak", name: "Рывок", skip_warmup: false, increase_on_end: false },
  { key: "deload", name: "Сброс", skip_warmup: true, increase_on_end: false },
];

export const LOAD_DELOAD_CYCLE: CyclePhaseDef[] = [
  {
    key: "work",
    name: "Нагрузка",
    skip_warmup: false,
    increase_on_end: true,
  },
  {
    key: "deload",
    name: "Разгрузка",
    skip_warmup: true,
    increase_on_end: false,
  },
];

export const LIGHT_MEDIUM_HEAVY_CYCLE: CyclePhaseDef[] = [
  {
    key: "light",
    name: "Лёгкая",
    skip_warmup: false,
    increase_on_end: false,
    percent_scale: 0.875,
  },
  {
    key: "medium",
    name: "Средняя",
    skip_warmup: false,
    increase_on_end: false,
    percent_scale: 1,
  },
  {
    key: "heavy",
    name: "Тяжёлая",
    skip_warmup: false,
    increase_on_end: true,
    percent_scale: 1.1,
  },
];

export const LIGHT_HEAVY_CYCLE: CyclePhaseDef[] = [
  {
    key: "light",
    name: "Лёгкая",
    skip_warmup: false,
    increase_on_end: false,
    percent_scale: 0.875,
  },
  {
    key: "heavy",
    name: "Тяжёлая",
    skip_warmup: false,
    increase_on_end: true,
    percent_scale: 1.1,
  },
];

export const CYCLE_TEMPLATES: Array<{
  id: "four_phase" | "load_deload" | "light_medium_heavy" | "light_heavy";
  name: string;
  hint: string;
  cycle: CyclePhaseDef[];
}> = [
  {
    id: "four_phase",
    name: "Разгон → сброс",
    hint: "Четыре фазы: разгон, набор, рывок, сброс. После набора можно поднять рабочие веса. Сброс без разминки.",
    cycle: FOUR_PHASE_CYCLE,
  },
  {
    id: "load_deload",
    name: "Нагрузка / разгрузка",
    hint: "Две фазы. После нагрузки можно поднять веса, разгрузка лёгкая и без разминки.",
    cycle: LOAD_DELOAD_CYCLE,
  },
  {
    id: "light_medium_heavy",
    name: "Лёгкая → средняя → тяжёлая",
    hint: "Три фазы одной очереди. От текущих рабочих: лёгкая ~70%, средняя как есть, тяжёлая тяжелее. После тяжёлой можно поднять веса.",
    cycle: LIGHT_MEDIUM_HEAVY_CYCLE,
  },
  {
    id: "light_heavy",
    name: "Лёгкая → тяжёлая",
    hint: "Две фазы одной очереди. Лёгкая легче рабочих, тяжёлая тяжелее. После тяжёлой можно поднять веса.",
    cycle: LIGHT_HEAVY_CYCLE,
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
    typeof value === "string" && value.trim().length > 0 && value.length <= 40
  );
}
