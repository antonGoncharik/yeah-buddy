import type { Exercise, SessionPreviousWork, SlotPlan } from "@/lib/types";
import { formatWeight } from "@/lib/workout/numbers";
import {
  slotNeedsFeel,
  slotNeedsMax,
  slotNeedsTrack,
} from "@/lib/workout/slot-plan";

export interface LoadHintInput {
  previous: SessionPreviousWork;
  step: number;
  /** Bottom of today's rep range. Null when the plan has no rep target. */
  reps: number | null;
  /** Top of today's rep range. Null when the plan is a single number or open. */
  repsTo: number | null;
  enabled: boolean;
}

/**
 * Gray line for the next session. Does not change the planned sets.
 * A real rep range (6–10) clamps the windows. A single target does not:
 * 100×8 with one in reserve becomes 102.5×7–8 or 100×9–10.
 */
export function formatNextLoadHint(input: LoadHintInput): string | null {
  if (!input.enabled || !input.previous.same_phase || !(input.step > 0)) {
    return null;
  }

  const { weight, reps, seconds, rir, hold, feel } = input.previous;
  if (
    seconds != null ||
    weight == null ||
    weight <= 0 ||
    reps == null ||
    reps <= 0 ||
    rir == null
  ) {
    return null;
  }

  const done = Math.max(1, Math.round(reps));
  const low = positiveInt(input.reps);
  const high = positiveInt(input.repsTo);
  const hasRange = low != null && high != null && high > low;
  const floor = hasRange ? low : null;
  const ceiling = hasRange ? high : null;

  if (hold || (rir <= 0 && floor != null && done < floor)) {
    return planLine(
      weight,
      floor != null ? windowLabel(floor, ceiling ?? floor) : String(done),
    );
  }

  if (rir <= 0) {
    return planLine(weight, String(done));
  }

  if (feel === "easy" && ceiling != null && floor != null && done > ceiling) {
    return planLine(bumpWeight(weight, input.step), String(floor));
  }

  const heavier = clampWindow(done - 1, done, floor, ceiling);
  const same = clampWindow(done + 1, done + 2, floor, ceiling);
  const heavierText = heavier
    ? option(bumpWeight(weight, input.step), heavier)
    : null;
  const sameText = same ? option(weight, same) : null;
  if (heavierText && sameText) {
    return `План на сегодня: ${heavierText} или ${sameText}`;
  }
  if (heavierText) {
    return `План на сегодня: ${heavierText}`;
  }
  if (sameText) {
    return `План на сегодня: ${sameText}`;
  }
  if (floor != null) {
    return planLine(weight, windowLabel(floor, ceiling ?? floor));
  }
  return planLine(weight, String(done));
}

/** Percent of 1RM and «по самочувствию». Tracks and a fixed kilogram stay quiet. */
export function slotWantsLoadHint(
  plan: SlotPlan | null,
  exercise: Pick<Exercise, "formula_preset">,
  phaseKey: string | null,
): boolean {
  if (slotNeedsTrack(plan, phaseKey)) {
    return false;
  }
  return (
    slotNeedsMax(plan, exercise, phaseKey) || slotNeedsFeel(plan, phaseKey)
  );
}

function planLine(weight: number, reps: string): string {
  return `План на сегодня: ${option(weight, reps)}`;
}

function option(weight: number, reps: string | [number, number]): string {
  const label = typeof reps === "string" ? reps : windowLabel(reps[0], reps[1]);
  return `${formatWeight(weight)} кг на ${label} повт.`;
}

function windowLabel(from: number, to: number): string {
  return from === to ? String(from) : `${from}–${to}`;
}

function clampWindow(
  from: number,
  to: number,
  low: number | null,
  high: number | null,
): [number, number] | null {
  let start = Math.max(1, from);
  let end = to;
  if (low != null) {
    start = Math.max(start, low);
  }
  if (high != null) {
    end = Math.min(end, high);
  }
  if (start > end || end < 1) {
    return null;
  }
  return [start, end];
}

function bumpWeight(weight: number, step: number): number {
  return Math.round((weight + step) * 100) / 100;
}

function positiveInt(value: number | null): number | null {
  if (value == null || value <= 0) {
    return null;
  }
  return Math.round(value);
}
