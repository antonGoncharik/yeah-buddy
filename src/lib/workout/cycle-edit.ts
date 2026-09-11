import type {
  CyclePhaseDef,
  FormulaPhaseSpec,
  FormulaSetSpec,
  WorkoutFormulas,
} from "@/lib/types";
import {
  cloneFormulas,
  DYNAMIC_DELOAD,
  STATIC_DELOAD,
} from "@/lib/workout/default-formulas";

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
  const trimmed = name.trim() || `Этап ${formulas.cycle.length + 1}`;
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

export function workForPhase(
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
