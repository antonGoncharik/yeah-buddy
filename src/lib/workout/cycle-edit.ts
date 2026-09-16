import type {
  CyclePhaseDef,
  FormulaPhaseSpec,
  FormulaSetSpec,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";
import { workSetsEqual } from "@/lib/workout/cycle-query";
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
  next.cycle = structuredClone(cycle);
  next.dynamic.phases = {};
  next.static.phases = {};
  if (next.cycle.length === 0) {
    next.cycle_auto_end = undefined;
  }
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
    next.dynamic.phases[phase.key] = phaseHasCustomWork(
      current,
      "dynamic",
      phase,
    )
      ? structuredClone(
          current.dynamic.phases[phase.key] ??
            workForPhase(next.dynamic.base, phase, DYNAMIC_DELOAD),
        )
      : workForPhase(next.dynamic.base, phase, DYNAMIC_DELOAD);
    next.static.phases[phase.key] = phaseHasCustomWork(current, "static", phase)
      ? structuredClone(
          current.static.phases[phase.key] ??
            workForPhase(next.static.base, phase, STATIC_DELOAD),
        )
      : workForPhase(next.static.base, phase, STATIC_DELOAD);
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
  const previous = formulas.cycle.find((phase) => phase.key === key);
  const next = cloneFormulas(formulas);
  next.cycle = next.cycle.map((phase) =>
    phase.key === key ? { ...phase, ...patch } : phase,
  );
  const updated = next.cycle.find((phase) => phase.key === key);
  if (
    !previous ||
    !updated ||
    (previous.skip_warmup === updated.skip_warmup &&
      previous.percent_scale === updated.percent_scale)
  ) {
    return next;
  }

  for (const kind of ["dynamic", "static"] as const) {
    if (!phaseHasCustomWork(formulas, kind, previous)) {
      next[kind].phases[key] = workForPhase(
        next[kind].base,
        updated,
        deloadFor(kind),
      );
    }
  }
  return next;
}

export function patchKindBaseWork(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  work: FormulaSetSpec[],
): WorkoutFormulas {
  const previousBase = formulas[kind].base;
  const next = cloneFormulas(formulas);
  next[kind] = {
    ...next[kind],
    base: { ...next[kind].base, work },
  };
  const deload = deloadFor(kind);
  for (const phase of next.cycle) {
    if (phaseHasCustomWork(formulas, kind, phase, previousBase)) {
      continue;
    }
    next[kind].phases[phase.key] = workForPhase(next[kind].base, phase, deload);
  }
  return next;
}

export function resetPhaseWork(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  key: string,
): WorkoutFormulas {
  const phase = formulas.cycle.find((item) => item.key === key);
  if (!phase) {
    return formulas;
  }
  const next = cloneFormulas(formulas);
  next[kind].phases[key] = workForPhase(
    next[kind].base,
    phase,
    deloadFor(kind),
  );
  return next;
}

export function phaseHasCustomWork(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  phase: CyclePhaseDef,
  base: FormulaPhaseSpec = formulas[kind].base,
): boolean {
  const stored = formulas[kind].phases[phase.key];
  if (!stored) {
    return false;
  }
  return !workSetsEqual(
    stored.work,
    workForPhase(base, phase, deloadFor(kind)).work,
  );
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

export function reorderCycle(
  formulas: WorkoutFormulas,
  keys: string[],
): WorkoutFormulas {
  if (keys.length !== formulas.cycle.length) {
    return formulas;
  }
  if (new Set(keys).size !== keys.length) {
    return formulas;
  }

  const byKey = new Map(formulas.cycle.map((phase) => [phase.key, phase]));
  const cycle: CyclePhaseDef[] = [];
  for (const key of keys) {
    const phase = byKey.get(key);
    if (!phase) {
      return formulas;
    }
    cycle.push(phase);
  }

  const next = cloneFormulas(formulas);
  next.cycle = structuredClone(cycle);
  return next;
}

export function workForPhase(
  base: FormulaPhaseSpec,
  phase: CyclePhaseDef,
  deload: FormulaSetSpec[],
): FormulaPhaseSpec {
  if (phase.work != null && phase.work.length > 0 && setsUseReps(base.work)) {
    return { warmup: [], work: structuredClone(phase.work) };
  }
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

function setsUseReps(work: FormulaSetSpec[]): boolean {
  return work.some((set) => set.reps != null);
}

function deloadFor(kind: WorkoutKind): FormulaSetSpec[] {
  return kind === "dynamic" ? DYNAMIC_DELOAD : STATIC_DELOAD;
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
