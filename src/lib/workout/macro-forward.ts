import { increaseMax } from "@/lib/workout/formulas";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

const SAME_KG = 0.05;

export function maxFollowsWeek(
  previewCurrent: number,
  savedWeek: number | null,
): boolean {
  if (savedWeek == null) {
    return false;
  }
  return Math.abs(previewCurrent - savedWeek) < SAME_KG;
}

/** Next week's max. `pinned` wins when it comes from another week, not this draft. */
export function forwardWeight(input: {
  week: number;
  step: number;
  increased: boolean;
  increasePercent: number;
  pinned: number | null;
}): number {
  if (input.pinned != null) {
    return input.pinned;
  }
  if (!input.increased) {
    return input.week;
  }
  return increaseMax(input.week, input.increasePercent, input.step);
}

/**
 * What to show under the week's max. Null when the next week keeps the same number
 * and the person has not typed a different one.
 */
export function forwardDraft(input: {
  weekDraft: string;
  step: number;
  increased: boolean;
  increasePercent: number;
  pinned: number | null;
  override: string | undefined;
}): string | null {
  if (input.override != null) {
    return input.override;
  }

  const week = parseDecimal(input.weekDraft);
  if (week == null || week <= 0) {
    return input.pinned == null ? null : formatWeight(input.pinned);
  }

  const next = forwardWeight({
    week,
    step: input.step,
    increased: input.increased,
    increasePercent: input.increasePercent,
    pinned: input.pinned,
  });
  if (Math.abs(next - week) < SAME_KG) {
    return null;
  }
  return formatWeight(next);
}
