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

export const STATIC_CABLE_WARMUP: FormulaSetSpec[] = STATIC_BARBELL_WARMUP;

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

export const TEN_WORKOUT_FORMULAS: WorkoutFormulas = pack(
  times(reps(70, 10), 3),
);

/** Default for new users. Already saved settings are not overwritten. */
export const DEFAULT_WORKOUT_FORMULAS: WorkoutFormulas =
  SIMPLE_WORKOUT_FORMULAS;

export const FORMULA_SYSTEM_IDS = [
  "simple",
  "five_by_five",
  "volume",
  "ten",
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
    hint: "3 подхода по 5 раз · 80%.",
    formulas: SIMPLE_WORKOUT_FORMULAS,
  },
  {
    id: "five_by_five",
    name: "5×5",
    hint: "5 подходов по 5 раз · 80%.",
    formulas: FIVE_BY_FIVE_FORMULAS,
  },
  {
    id: "volume",
    name: "3×8",
    hint: "На массу. 3 подхода по 8 раз · 70%.",
    formulas: VOLUME_WORKOUT_FORMULAS,
  },
  {
    id: "ten",
    name: "3×10",
    hint: "На массу. 3 подхода по 10 раз · 70%.",
    formulas: TEN_WORKOUT_FORMULAS,
  },
  {
    id: "pyramid",
    name: "Пирамида",
    hint: "Сила. 80×5 / 75×6 / 70×8.",
    formulas: PYRAMID_WORKOUT_FORMULAS,
  },
];

function phase(
  key: string,
  name: string,
  extra: {
    skip_warmup?: boolean;
    increase_on_end?: boolean;
    percent_scale?: number;
  } = {},
): CyclePhaseDef {
  return {
    key,
    name,
    skip_warmup: extra.skip_warmup ?? false,
    increase_on_end: extra.increase_on_end ?? false,
    percent_scale: extra.percent_scale,
  };
}

export const FOUR_PHASE_CYCLE: CyclePhaseDef[] = [
  phase("ramp", "Разгон"),
  phase("volume", "Набор", { increase_on_end: true }),
  phase("peak", "Рывок"),
  phase("deload", "Сброс", { skip_warmup: true }),
];

export const LOAD_DELOAD_CYCLE: CyclePhaseDef[] = [
  phase("work", "Нагрузка", { increase_on_end: true }),
  phase("deload", "Разгрузка", { skip_warmup: true }),
];

export const LIGHT_MEDIUM_HEAVY_CYCLE: CyclePhaseDef[] = [
  phase("light", "Лёгкая", { percent_scale: 0.875 }),
  phase("medium", "Средняя", { percent_scale: 1 }),
  phase("heavy", "Тяжёлая", { increase_on_end: true, percent_scale: 1.1 }),
];

export const LIGHT_HEAVY_CYCLE: CyclePhaseDef[] = [
  phase("light", "Лёгкая", { percent_scale: 0.875 }),
  phase("heavy", "Тяжёлая", { increase_on_end: true, percent_scale: 1.1 }),
];

export const LINEAR_CYCLE: CyclePhaseDef[] = [
  phase("w70", "70%", { percent_scale: 0.875 }),
  phase("w75", "75%", { percent_scale: 0.9375 }),
  phase("w80", "80%", { percent_scale: 1 }),
  phase("w85", "85%", { increase_on_end: true, percent_scale: 1.0625 }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

export const VOLUME_STRENGTH_CYCLE: CyclePhaseDef[] = [
  phase("volume", "Объём", { percent_scale: 0.875 }),
  phase("strength", "Сила", { increase_on_end: true, percent_scale: 1.1 }),
  phase("deload", "Сброс", { skip_warmup: true }),
];

export const CYCLE_TEMPLATES: Array<{
  id:
    | "four_phase"
    | "load_deload"
    | "light_medium_heavy"
    | "light_heavy"
    | "linear"
    | "volume_strength";
  name: string;
  hint: string;
  cycle: CyclePhaseDef[];
}> = [
  {
    id: "four_phase",
    name: "Разгон → сброс",
    hint: "Разгон, набор, рывок, сброс. После набора можно поднять веса.",
    cycle: FOUR_PHASE_CYCLE,
  },
  {
    id: "load_deload",
    name: "Нагрузка / разгрузка",
    hint: "После нагрузки можно поднять веса. Разгрузка лёгкая.",
    cycle: LOAD_DELOAD_CYCLE,
  },
  {
    id: "light_medium_heavy",
    name: "Лёгкая → средняя → тяжёлая",
    hint: "Лёгкая, средняя, тяжёлая. После тяжёлой можно поднять веса.",
    cycle: LIGHT_MEDIUM_HEAVY_CYCLE,
  },
  {
    id: "light_heavy",
    name: "Лёгкая → тяжёлая",
    hint: "Лёгкая и тяжёлая. После тяжёлой можно поднять веса.",
    cycle: LIGHT_HEAVY_CYCLE,
  },
  {
    id: "linear",
    name: "Линейный",
    hint: "70 → 75 → 80 → 85, потом сброс. После 85% можно поднять веса.",
    cycle: LINEAR_CYCLE,
  },
  {
    id: "volume_strength",
    name: "Объём → сила",
    hint: "Неделя объёма, неделя силы, сброс. После силы можно поднять веса.",
    cycle: VOLUME_STRENGTH_CYCLE,
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
