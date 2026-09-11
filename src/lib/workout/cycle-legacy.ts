import type {
  CyclePhaseDef,
  FormulaPhaseSpec,
  KindFormulas,
  WorkoutFormulas,
} from "@/lib/types";
import { workForPhase } from "@/lib/workout/cycle-edit";
import { workSetsEqual } from "@/lib/workout/cycle-query";
import {
  cloneFormulas,
  DYNAMIC_DELOAD,
  FOUR_PHASE_CYCLE,
  STATIC_DELOAD,
} from "@/lib/workout/default-formulas";

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
