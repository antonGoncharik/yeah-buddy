import type {
  CyclePhaseDef,
  FormulaPhaseSpec,
  FormulaSetSpec,
  KindFormulas,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";
import {
  cloneFormulas,
  DYNAMIC_DELOAD,
  FOUR_PHASE_CYCLE,
  STATIC_DELOAD,
} from "@/lib/workout/default-formulas";

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

export function withCycle(
  formulas: WorkoutFormulas,
  cycle: CyclePhaseDef[],
): WorkoutFormulas {
  const next = cloneFormulas(formulas);
  next.cycle = cycle.map((phase) => ({ ...phase }));
  next.dynamic.phases = {};
  next.static.phases = {};
  for (const phase of next.cycle) {
    next.dynamic.phases[phase.key] = workForPhase(
      next.dynamic.base,
      phase,
      DYNAMIC_DELOAD,
    );
    next.static.phases[phase.key] = workForPhase(
      next.static.base,
      phase,
      STATIC_DELOAD,
    );
  }
  return next;
}

export function applyWorkPattern(
  current: WorkoutFormulas,
  pattern: WorkoutFormulas,
): WorkoutFormulas {
  const next = cloneFormulas(current);
  next.dynamic.base = structuredClone(pattern.dynamic.base);
  next.static.base = structuredClone(pattern.static.base);
  next.warmups = structuredClone(pattern.warmups);
  for (const phase of next.cycle) {
    next.dynamic.phases[phase.key] = workForPhase(
      next.dynamic.base,
      phase,
      DYNAMIC_DELOAD,
    );
    next.static.phases[phase.key] = workForPhase(
      next.static.base,
      phase,
      STATIC_DELOAD,
    );
  }
  return next;
}

export function addCyclePhase(
  formulas: WorkoutFormulas,
  name: string,
): WorkoutFormulas {
  const used = new Set(formulas.cycle.map((phase) => phase.key));
  const key = nextCustomKey(used);
  const trimmed = name.trim() || `Фаза ${formulas.cycle.length + 1}`;
  const next = cloneFormulas(formulas);
  const phase: CyclePhaseDef = {
    key,
    name: trimmed.slice(0, 40),
    skip_warmup: false,
    increase_on_end: false,
  };
  next.cycle = [...next.cycle, phase];
  next.dynamic.phases[key] = workForPhase(
    next.dynamic.base,
    phase,
    DYNAMIC_DELOAD,
  );
  next.static.phases[key] = workForPhase(
    next.static.base,
    phase,
    STATIC_DELOAD,
  );
  return next;
}

export function patchCyclePhase(
  formulas: WorkoutFormulas,
  key: string,
  patch: Partial<Omit<CyclePhaseDef, "key">>,
): WorkoutFormulas {
  const next = cloneFormulas(formulas);
  next.cycle = next.cycle.map((phase) =>
    phase.key === key ? { ...phase, ...patch } : phase,
  );
  return next;
}

export function removeCyclePhase(
  formulas: WorkoutFormulas,
  key: string,
): WorkoutFormulas {
  const next = cloneFormulas(formulas);
  next.cycle = next.cycle.filter((phase) => phase.key !== key);
  delete next.dynamic.phases[key];
  delete next.static.phases[key];
  return next;
}

export function moveCyclePhase(
  formulas: WorkoutFormulas,
  key: string,
  direction: -1 | 1,
): WorkoutFormulas {
  const index = formulas.cycle.findIndex((phase) => phase.key === key);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= formulas.cycle.length) {
    return formulas;
  }

  const cycle = [...formulas.cycle];
  const [item] = cycle.splice(index, 1);
  if (!item) {
    return formulas;
  }
  cycle.splice(nextIndex, 0, item);
  const next = cloneFormulas(formulas);
  next.cycle = cycle;
  return next;
}

export function hydrateCyclePhases(formulas: WorkoutFormulas): WorkoutFormulas {
  const next = cloneFormulas(formulas);
  for (const phase of next.cycle) {
    if (!next.dynamic.phases[phase.key]) {
      next.dynamic.phases[phase.key] = workForPhase(
        next.dynamic.base,
        phase,
        DYNAMIC_DELOAD,
      );
    }
    if (!next.static.phases[phase.key]) {
      next.static.phases[phase.key] = workForPhase(
        next.static.base,
        phase,
        STATIC_DELOAD,
      );
    }
  }
  return next;
}

export function convertLegacyKind(
  legacy: Record<"ramp" | "volume" | "peak" | "deload", FormulaPhaseSpec>,
  keepCycle: boolean,
): KindFormulas {
  return {
    base: structuredClone(legacy.ramp),
    phases: keepCycle
      ? {
          ramp: structuredClone(legacy.ramp),
          volume: structuredClone(legacy.volume),
          peak: structuredClone(legacy.peak),
          deload: structuredClone(legacy.deload),
        }
      : {},
  };
}

export function legacyKeepsFourPhase(dynamic: {
  ramp: FormulaPhaseSpec;
  volume: FormulaPhaseSpec;
  peak: FormulaPhaseSpec;
}): boolean {
  return (
    !workSetsEqual(dynamic.ramp.work, dynamic.volume.work) ||
    !workSetsEqual(dynamic.ramp.work, dynamic.peak.work)
  );
}

export function legacyCycle(keep: boolean): CyclePhaseDef[] {
  return keep ? FOUR_PHASE_CYCLE.map((phase) => ({ ...phase })) : [];
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

function workForPhase(
  base: FormulaPhaseSpec,
  phase: CyclePhaseDef,
  deload: FormulaSetSpec[],
): FormulaPhaseSpec {
  if (phase.percent_scale != null) {
    return {
      warmup: [],
      work: scaleWork(base.work, phase.percent_scale),
    };
  }
  if (phase.skip_warmup) {
    return { warmup: [], work: structuredClone(deload) };
  }
  return structuredClone(base);
}

function scaleWork(work: FormulaSetSpec[], factor: number): FormulaSetSpec[] {
  return work.map((set) => ({
    ...set,
    percent: Math.max(1, Math.round(set.percent * factor)),
  }));
}

function nextCustomKey(used: Set<string>): string {
  let n = used.size + 1;
  let key = `p${n}`;
  while (used.has(key)) {
    n += 1;
    key = `p${n}`;
  }
  return key;
}
