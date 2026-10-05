/** Symmetric band around macro targets (protein, fat, carbs). */
export const MACRO_HIT_RATIO = 0.02;

export function macroInGoal(fact: number, target: number): boolean {
  if (target <= 0) {
    return false;
  }
  return Math.abs(fact - target) / target <= MACRO_HIT_RATIO;
}

/** Gram tolerance for UI copy (bot «ещё …») at a given target. */
export function macroGoalToleranceGrams(target: number): number {
  if (target <= 0) {
    return 0;
  }
  return target * MACRO_HIT_RATIO;
}
