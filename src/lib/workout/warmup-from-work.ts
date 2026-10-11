import type { FormulaPreset, FormulaSetSpec, WorkoutKind } from "@/lib/types";
import { calcPlannedWeight } from "@/lib/workout/formulas";

export const EMPTY_BAR_KG = 20;

const BARBELL_DYNAMIC: FormulaSetSpec[] = [
  { percent: 40, reps: 5, seconds: null },
  { percent: 60, reps: 3, seconds: null },
  { percent: 80, reps: 1, seconds: null },
];

const CABLE_DYNAMIC: FormulaSetSpec[] = [
  { percent: 50, reps: 8, seconds: null },
  { percent: 75, reps: 4, seconds: null },
];

/** Static holds: same shape as legacy static barbell warmup, scaled to working weight. */
const STATIC_BARBELL_TEMPLATE: FormulaSetSpec[] = [
  { percent: 50, reps: 5, seconds: null },
  { percent: 70, reps: 3, seconds: null },
  { percent: 100, reps: null, seconds: 2 },
];

const STATIC_CABLE_TEMPLATE: FormulaSetSpec[] = STATIC_BARBELL_TEMPLATE;

export function warmupSetsForWorkingWeight(
  workingWeight: number,
  step: number,
  preset: FormulaPreset,
  kind: WorkoutKind,
): FormulaSetSpec[] {
  if (preset === "none" || !(workingWeight > 0)) {
    return [];
  }

  const template =
    kind === "static"
      ? preset === "cable"
        ? STATIC_CABLE_TEMPLATE
        : STATIC_BARBELL_TEMPLATE
      : preset === "cable"
        ? CABLE_DYNAMIC
        : BARBELL_DYNAMIC;

  const rows: FormulaSetSpec[] = [];
  let prevWeight: number | null = null;
  for (const item of template) {
    const isHold = item.seconds != null && item.reps == null;
    const weight = calcPlannedWeight(workingWeight, item.percent, step);
    const min =
      preset === "barbell" && kind === "dynamic"
        ? Math.max(EMPTY_BAR_KG, step)
        : step;
    const clamped = isHold ? workingWeight : Math.max(min, weight);
    if (!isHold && clamped >= workingWeight) {
      continue;
    }
    if (prevWeight != null && clamped === prevWeight) {
      continue;
    }
    rows.push({
      percent: item.percent,
      reps: item.reps,
      seconds: item.seconds,
    });
    prevWeight = clamped;
  }

  return rows;
}

export function warmupPlannedWeights(
  workingWeight: number,
  step: number,
  preset: FormulaPreset,
  kind: WorkoutKind,
): number[] {
  const specs = warmupSetsForWorkingWeight(workingWeight, step, preset, kind);
  const out: number[] = [];
  let prev: number | null = null;
  for (const item of specs) {
    const weight = calcPlannedWeight(workingWeight, item.percent, step);
    const min =
      preset === "barbell" && kind === "dynamic"
        ? Math.max(EMPTY_BAR_KG, step)
        : step;
    const clamped = Math.max(min, weight);
    if (clamped >= workingWeight) {
      continue;
    }
    if (prev != null && clamped === prev) {
      continue;
    }
    out.push(clamped);
    prev = clamped;
  }
  return out;
}
