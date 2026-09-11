import type { FormulaSetSpec, KindWarmups, WorkoutKind } from "@/lib/types";

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

export { reps, seconds, times };
