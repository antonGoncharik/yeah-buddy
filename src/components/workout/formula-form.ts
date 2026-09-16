import type {
  FormulaSetSpec,
  WarmupPresetId,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";
import { patchKindBaseWork } from "@/lib/workout/cycle";
import { WARMUP_PRESET_IDS } from "@/lib/workout/labels";
import { parseDecimal } from "@/lib/workout/numbers";

export const MAX_SETS = 8;
export const MAX_PHASES = 8;

/** `50 · 70 · 80 %` or «нет». */
export function warmupSummary(sets: FormulaSetSpec[]): string {
  if (sets.length === 0) {
    return "нет";
  }
  return `${sets.map((set) => set.percent).join(" · ")} %`;
}

/** Hint under the «Разминка» row: both presets in one line. */
export function warmupsHint(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
): string {
  const warmups = formulas.warmups[kind];
  return `Штанга ${warmupSummary(warmups.barbell)} · Блок ${warmupSummary(warmups.cable)}`;
}

/** Hint under the «Этапы цикла» row. */
export function cycleHint(formulas: WorkoutFormulas): string {
  const cycle = formulas.cycle;
  if (cycle.length === 0) {
    return "Не настроены. Вес по неделям не меняется.";
  }
  const names = cycle.map((phase) => phase.name).join(" → ");
  if (formulas.cycle_loop) {
    return `${names} · по кругу`;
  }
  return formulas.cycle_auto_end ? `${names} · меняется после круга` : names;
}

export function patchBaseWork(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  work: FormulaSetSpec[],
): WorkoutFormulas {
  return patchKindBaseWork(formulas, kind, work);
}

export function patchPhaseWork(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  key: string,
  work: FormulaSetSpec[],
): WorkoutFormulas {
  const current = formulas[kind].phases[key] ?? formulas[kind].base;
  return {
    ...formulas,
    [kind]: {
      ...formulas[kind],
      phases: {
        ...formulas[kind].phases,
        [key]: { ...current, work },
      },
    },
  };
}

export function patchWarmup(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  preset: WarmupPresetId,
  sets: FormulaSetSpec[],
): WorkoutFormulas {
  return {
    ...formulas,
    warmups: {
      ...formulas.warmups,
      [kind]: {
        ...formulas.warmups[kind],
        [preset]: sets,
      },
    },
  };
}

export function toPayload(maxIncreaseRaw: string, formulas: WorkoutFormulas) {
  const max_increase_percent = parseDecimal(maxIncreaseRaw);
  if (max_increase_percent == null || max_increase_percent < 0) {
    return null;
  }

  if (
    formulas.dynamic.base.work.length < 1 ||
    formulas.static.base.work.length < 1 ||
    !setsOk(formulas.dynamic.base.work) ||
    !setsOk(formulas.static.base.work)
  ) {
    return null;
  }

  for (const phase of formulas.cycle) {
    const dynamic = formulas.dynamic.phases[phase.key];
    const staticKind = formulas.static.phases[phase.key];
    if (
      !dynamic ||
      !staticKind ||
      dynamic.work.length < 1 ||
      staticKind.work.length < 1 ||
      !setsOk(dynamic.work) ||
      !setsOk(staticKind.work)
    ) {
      return null;
    }
    if (!phase.name.trim()) {
      return null;
    }
  }

  for (const kind of ["dynamic", "static"] as const) {
    for (const preset of WARMUP_PRESET_IDS) {
      if (!setsOk(formulas.warmups[kind][preset])) {
        return null;
      }
    }
  }

  return {
    max_increase_percent,
    formulas,
  };
}

export function setsOk(sets: FormulaSetSpec[]): boolean {
  return sets.every((set) => {
    if (!(set.percent >= 0) || !Number.isFinite(set.percent)) {
      return false;
    }
    const hasReps = set.reps != null && set.reps > 0;
    const hasSeconds = set.seconds != null && set.seconds > 0;
    return hasReps !== hasSeconds;
  });
}
