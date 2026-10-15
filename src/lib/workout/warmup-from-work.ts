import type {
  FormulaPreset,
  FormulaSetSpec,
  KindWarmups,
  WorkoutKind,
} from "@/lib/types";
import {
  BARBELL_WARMUP,
  CABLE_WARMUP,
  DEFAULT_WARMUP_PRESETS,
  STATIC_BARBELL_WARMUP,
  STATIC_CABLE_WARMUP,
} from "@/lib/workout/formula-warmups";
import { calcPlannedWeight, floorToStep } from "@/lib/workout/formulas";

export const EMPTY_BAR_KG = 20;

function warmupTemplateFor(
  kind: WorkoutKind,
  preset: Exclude<FormulaPreset, "none">,
  warmups: Record<WorkoutKind, KindWarmups>,
): FormulaSetSpec[] {
  const custom = warmups[kind][preset];
  if (custom.length > 0) {
    return custom;
  }
  if (kind === "static") {
    return preset === "cable" ? STATIC_CABLE_WARMUP : STATIC_BARBELL_WARMUP;
  }
  return preset === "cable" ? CABLE_WARMUP : BARBELL_WARMUP;
}

export function plannedWarmupWeight(
  topWork: number,
  set: FormulaSetSpec,
  step: number,
  preset: FormulaPreset,
  kind: WorkoutKind,
): number {
  if (set.seconds != null && set.reps == null) {
    return topWork;
  }
  let planned_weight = calcPlannedWeight(topWork, set.percent, step);
  if (preset === "barbell" && kind === "dynamic") {
    planned_weight = Math.max(EMPTY_BAR_KG, planned_weight);
    if (planned_weight >= topWork) {
      planned_weight = Math.max(
        EMPTY_BAR_KG,
        floorToStep(topWork - step, step),
      );
    }
  }
  return planned_weight;
}

export function warmupSetsForWorkingWeight(
  workingWeight: number,
  step: number,
  preset: FormulaPreset,
  kind: WorkoutKind,
  warmups: Record<WorkoutKind, KindWarmups> = DEFAULT_WARMUP_PRESETS,
): FormulaSetSpec[] {
  if (preset === "none" || !(workingWeight > 0)) {
    return [];
  }

  const template = warmupTemplateFor(kind, preset, warmups);
  const rows: FormulaSetSpec[] = [];
  let prevWeight: number | null = null;
  for (const item of template) {
    const clamped = plannedWarmupWeight(
      workingWeight,
      item,
      step,
      preset,
      kind,
    );
    const isHold = item.seconds != null && item.reps == null;
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
  warmups: Record<WorkoutKind, KindWarmups> = DEFAULT_WARMUP_PRESETS,
): number[] {
  const specs = warmupSetsForWorkingWeight(
    workingWeight,
    step,
    preset,
    kind,
    warmups,
  );
  const out: number[] = [];
  let prev: number | null = null;
  for (const item of specs) {
    const clamped = plannedWarmupWeight(
      workingWeight,
      item,
      step,
      preset,
      kind,
    );
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
