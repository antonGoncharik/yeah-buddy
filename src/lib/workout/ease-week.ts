import type { SessionFeel } from "@/lib/types";
import { floorToStep } from "@/lib/workout/formulas";

export type EaseWeekKind = "deload" | "lighter";

export function threeMisses(feels: readonly (SessionFeel | null)[]): boolean {
  const last = feels.slice(-3);
  return last.length === 3 && last.every((feel) => feel === "miss");
}

export function cycleCanDeload(input: {
  cycle: ReadonlyArray<{ key: string }>;
  phaseType: string | null;
  deloadTaken: boolean;
}): boolean {
  if (
    input.phaseType == null ||
    input.phaseType === "deload" ||
    input.deloadTaken
  ) {
    return false;
  }
  if (input.cycle.length === 0) {
    return true;
  }
  return input.cycle.some((phase) => phase.key === "deload");
}

export function easeWeekKind(input: {
  feels: readonly (SessionFeel | null)[];
  eased: boolean;
  inCycle: boolean;
  canDeload: boolean;
}): EaseWeekKind | null {
  if (input.eased || !threeMisses(input.feels)) {
    return null;
  }
  if (input.inCycle) {
    return input.canDeload ? "deload" : null;
  }
  return "lighter";
}

/** One step down, still on the plate grid. Null when there is nowhere to go. */
export function easedPlanningMax(current: number, step: number): number | null {
  if (!(current > 0) || !(step > 0)) {
    return null;
  }
  const next = floorToStep(current - step, step);
  if (!(next > 0) || next >= current) {
    return null;
  }
  return next;
}

export function easeWeekMessage(kind: EaseWeekKind): string {
  if (kind === "deload") {
    return "Три раза не пошло. Можно открыть лёгкую неделю — максимум тот же, подходы легче.";
  }
  return "Три раза не пошло. Можно снизить рабочий вес на шаг.";
}

export function easeWeekConfirm(kind: EaseWeekKind): string {
  if (kind === "deload") {
    return "Открыть лёгкую неделю?";
  }
  return "Снизить рабочий вес на шаг?";
}

export function readEaseWeek(value: unknown): EaseWeekKind | null {
  return value === "deload" || value === "lighter" ? value : null;
}
