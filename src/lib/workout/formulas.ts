import type {
  FormulaPhaseSpec,
  FormulaPreset,
  FormulaSetSpec,
  PhaseType,
  WarmupPresetId,
  WorkoutKind,
} from "@/lib/types";
import { DEFAULT_WARMUP_PRESETS } from "@/lib/workout/default-formulas";

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

export function resolvePhaseSpec(
  base: FormulaPhaseSpec,
  _kind: WorkoutKind,
  phase: PhaseType,
  preset: FormulaPreset,
  warmups: Record<WarmupPresetId, FormulaSetSpec[]> = DEFAULT_WARMUP_PRESETS,
): FormulaPhaseSpec {
  if (preset === "none") {
    return { warmup: [], work: [] };
  }

  if (phase === "deload") {
    return base;
  }

  return {
    warmup: warmups[preset] ?? DEFAULT_WARMUP_PRESETS.barbell,
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

export function nextPhaseType(phase: PhaseType): PhaseType | null {
  if (phase === "ramp") {
    return "volume";
  }
  if (phase === "volume") {
    return "peak";
  }
  if (phase === "peak") {
    return "deload";
  }
  return null;
}

export function shouldIncreaseMax(from: PhaseType, to: PhaseType): boolean {
  return from === "volume" && to === "peak";
}
