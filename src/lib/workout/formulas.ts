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
import { DEFAULT_WARMUP_PRESETS } from "@/lib/workout/formula-warmups";
import {
  plannedWarmupWeight,
  warmupSetsForWorkingWeight,
} from "@/lib/workout/warmup-from-work";

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
  const raised = floorToStep(maxWeight * (1 + percent / 100), step);
  // A small max rounds back to itself. A real increase is at least one step.
  if (percent > 0 && step > 0 && raised <= maxWeight) {
    return floorToStep(maxWeight + step, step);
  }
  return raised;
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
  _kind: WorkoutKind,
  _skipWarmup: boolean,
  _preset: FormulaPreset,
  _warmups: WorkoutFormulas["warmups"] = DEFAULT_WORKOUT_FORMULAS.warmups,
): FormulaPhaseSpec {
  if (_preset === "none") {
    return { warmup: [], work: [] };
  }

  return {
    warmup: [],
    work: base.work,
  };
}

export function plannedSetsFromFormula(
  spec: FormulaPhaseSpec,
  maxWeight: number,
  step: number,
  kind: WorkoutKind,
  preset: FormulaPreset = "barbell",
  skipWarmup = false,
  warmups: WorkoutFormulas["warmups"] = DEFAULT_WARMUP_PRESETS,
): Array<{
  set_type: "warmup" | "work";
  set_number: number;
  planned_weight: number;
  planned_reps: number | null;
  planned_seconds: number | null;
}> {
  const workRows = spec.work.map((set) => ({
    ...set,
    set_type: "work" as const,
  }));
  let topWork = 0;
  for (const set of workRows) {
    const weight = calcPlannedWeight(maxWeight, set.percent, step);
    if (weight > topWork) {
      topWork = weight;
    }
  }

  const warmupSpec = skipWarmup
    ? []
    : warmupSetsForWorkingWeight(
        topWork,
        step,
        preset,
        kind,
        warmups,
        maxWeight,
      );

  const rows = [
    ...warmupSpec.map((set) => ({ ...set, set_type: "warmup" as const })),
    ...workRows,
  ];

  return rows.map((set, index) => {
    const planned_weight =
      set.set_type === "warmup"
        ? plannedWarmupWeight(topWork, set, step, preset, kind, maxWeight)
        : calcPlannedWeight(maxWeight, set.percent, step);
    return {
      set_type: set.set_type,
      set_number: index + 1,
      planned_weight,
      planned_reps: set.reps,
      planned_seconds: set.seconds,
    };
  });
}

export function setUsesHold(set: FormulaSetSpec): boolean {
  return set.seconds != null && set.reps == null;
}

export function nextPhaseType(
  phase: string,
  cycle: CyclePhaseDef[] = [],
  loop = false,
): string | null {
  return nextCyclePhase(phase, cycle, loop);
}

export function shouldIncreaseMax(
  from: string,
  to: string | null,
  cycle: CyclePhaseDef[] = [],
): boolean {
  return shouldIncreaseFromCycle(from, to, cycle);
}
