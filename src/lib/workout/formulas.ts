import type {
  CyclePhaseDef,
  FormulaPhaseSpec,
  FormulaPreset,
  FormulaSetSpec,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";
import {
  nextPhaseType as nextCyclePhase,
  previewMaxForPhase as previewMaxFromCycle,
  shouldIncreaseMax as shouldIncreaseFromCycle,
} from "@/lib/workout/cycle";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";

export function floorToStep(weight: number, step: number): number {
  if (!(step > 0) || !Number.isFinite(weight)) {
    return weight;
  }

  const units = Math.floor((weight + 1e-9) / step);
  return Math.round(units * step * 100) / 100;
}

export function calcPlannedWeight(
  maxWeight: number,
  percent: number,
  step: number,
): number {
  return floorToStep((maxWeight * percent) / 100, step);
}

export function increaseMax(
  maxWeight: number,
  percent: number,
  step: number,
): number {
  return floorToStep(maxWeight * (1 + percent / 100), step);
}

/** Example kg on the formulas screen: later phases may already use the raised max. */
export function previewMaxForPhase(
  cycle: CyclePhaseDef[],
  key: string,
  maxWeight: number,
  increasePercent: number,
  step: number,
): number {
  return previewMaxFromCycle(
    cycle,
    key,
    maxWeight,
    increasePercent,
    step,
    increaseMax,
  );
}

export function resolvePhaseSpec(
  base: FormulaPhaseSpec,
  kind: WorkoutKind,
  skipWarmup: boolean,
  preset: FormulaPreset,
  warmups: WorkoutFormulas["warmups"] = DEFAULT_WORKOUT_FORMULAS.warmups,
): FormulaPhaseSpec {
  if (preset === "none") {
    return { warmup: [], work: [] };
  }

  if (skipWarmup) {
    return { warmup: [], work: base.work };
  }

  const pack = warmups[kind] ?? DEFAULT_WORKOUT_FORMULAS.warmups[kind];
  return {
    warmup: pack[preset] ?? DEFAULT_WORKOUT_FORMULAS.warmups[kind][preset],
    work: base.work,
  };
}

export function plannedSetsFromFormula(
  spec: FormulaPhaseSpec,
  maxWeight: number,
  step: number,
  _kind: WorkoutKind,
): Array<{
  set_type: "warmup" | "work";
  set_number: number;
  planned_weight: number;
  planned_reps: number | null;
  planned_seconds: number | null;
}> {
  const rows = [
    ...spec.warmup.map((set) => ({ ...set, set_type: "warmup" as const })),
    ...spec.work.map((set) => ({ ...set, set_type: "work" as const })),
  ];

  return rows.map((set, index) => ({
    set_type: set.set_type,
    set_number: index + 1,
    planned_weight: calcPlannedWeight(maxWeight, set.percent, step),
    planned_reps: set.reps,
    planned_seconds: set.seconds,
  }));
}

export function setUsesHold(set: FormulaSetSpec): boolean {
  return set.seconds != null && set.reps == null;
}

export function nextPhaseType(
  phase: string,
  cycle: CyclePhaseDef[] = [],
): string | null {
  return nextCyclePhase(phase, cycle);
}

export function shouldIncreaseMax(
  from: string,
  to: string,
  cycle: CyclePhaseDef[] = [],
): boolean {
  return shouldIncreaseFromCycle(from, to, cycle);
}
