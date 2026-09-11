import type {
  FormulaSetSpec,
  KindFormulas,
  WorkoutFormulas,
} from "@/lib/types";
import {
  DEFAULT_WARMUP_PRESETS,
  reps,
  STATIC_BASE_WORK,
  times,
} from "@/lib/workout/formula-warmups";

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
