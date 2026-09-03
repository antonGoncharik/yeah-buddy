import type { FormulaPhaseSpec, PhaseType, WorkoutKind } from "@/lib/types";

export function roundToStep(weight: number, step: number): number {
  if (!(step > 0)) {
    return weight;
  }

  return Math.round(weight / step) * step;
}

export function calcPlannedWeight(
  maxWeight: number,
  percent: number,
  step: number,
): number {
  return roundToStep((maxWeight * percent) / 100, step);
}

export function increaseMax(
  maxWeight: number,
  percent: number,
  step: number,
): number {
  return roundToStep(maxWeight * (1 + percent / 100), step);
}

export function plannedSetsFromFormula(
  spec: FormulaPhaseSpec,
  maxWeight: number,
  step: number,
  kind: WorkoutKind,
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
    planned_reps: kind === "dynamic" ? set.reps : null,
    planned_seconds: kind === "static" ? set.seconds : null,
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
