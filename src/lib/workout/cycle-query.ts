import type {
  CyclePhaseDef,
  FormulaPhaseSpec,
  FormulaSetSpec,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";

const LEGACY_NEXT: Record<string, string | null> = {
  ramp: "volume",
  volume: "peak",
  peak: "deload",
  deload: null,
};

export function workSetsEqual(
  left: FormulaSetSpec[],
  right: FormulaSetSpec[],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function specForPhase(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  phaseKey: string | null,
): FormulaPhaseSpec {
  if (phaseKey) {
    return formulas[kind].phases[phaseKey] ?? formulas[kind].base;
  }
  return formulas[kind].base;
}

export function cycleDef(
  cycle: CyclePhaseDef[],
  key: string,
): CyclePhaseDef | null {
  return cycle.find((phase) => phase.key === key) ?? null;
}

export function nextPhaseType(
  current: string,
  cycle: CyclePhaseDef[],
): string | null {
  if (cycle.length > 0) {
    const index = cycle.findIndex((phase) => phase.key === current);
    if (index < 0) {
      return null;
    }
    return cycle[index + 1]?.key ?? null;
  }

  return LEGACY_NEXT[current] ?? null;
}

export function shouldIncreaseMax(
  from: string,
  to: string,
  cycle: CyclePhaseDef[],
): boolean {
  if (cycle.length > 0) {
    const current = cycleDef(cycle, from);
    const next = cycleDef(cycle, to);
    return Boolean(current?.increase_on_end && next);
  }

  return from === "volume" && to === "peak";
}

export function previewMaxForPhase(
  cycle: CyclePhaseDef[],
  key: string,
  maxWeight: number,
  increasePercent: number,
  step: number,
  increase: (max: number, percent: number, step: number) => number,
): number {
  if (raisedMaxForPhase(cycle, key)) {
    return increase(maxWeight, increasePercent, step);
  }
  return maxWeight;
}

export function raisedMaxForPhase(
  cycle: CyclePhaseDef[],
  key: string,
): boolean {
  if (cycle.length === 0) {
    return key === "peak" || key === "deload";
  }

  const index = cycle.findIndex((phase) => phase.key === key);
  if (index <= 0) {
    return false;
  }

  return cycle.slice(0, index).some((phase) => phase.increase_on_end);
}

export function recapEndPhaseKey(
  cycle: CyclePhaseDef[],
  phaseKeys: string[],
): string | null {
  if (cycle.length > 0) {
    const preferred = [...cycle]
      .reverse()
      .find((phase) => !phase.skip_warmup)?.key;
    if (preferred && phaseKeys.includes(preferred)) {
      return preferred;
    }
  }

  if (phaseKeys.includes("peak")) {
    return "peak";
  }
  if (phaseKeys.includes("volume")) {
    return "volume";
  }
  return phaseKeys.at(-1) ?? null;
}

export function firstCyclePhase(cycle: CyclePhaseDef[]): CyclePhaseDef | null {
  return cycle[0] ?? null;
}

export function isLastCyclePhase(key: string, cycle: CyclePhaseDef[]): boolean {
  return nextPhaseType(key, cycle) == null;
}

export function sortOrderForPhase(
  key: string,
  cycle: CyclePhaseDef[],
  fallback: number,
): number {
  const index = cycle.findIndex((phase) => phase.key === key);
  if (index >= 0) {
    return index + 1;
  }
  return fallback;
}
