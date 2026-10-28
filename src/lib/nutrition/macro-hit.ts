/** Symmetric band around macro targets (protein, fat, carbs). */
export const MACRO_HIT_RATIO = 0.02;

export function macroInGoal(fact: number, target: number): boolean {
  if (target <= 0) {
    return false;
  }
  return Math.abs(fact - target) / target <= MACRO_HIT_RATIO;
}

/** Low side of the band, including any surplus. An empty fact does not count. */
export function macroReached(fact: number, target: number): boolean {
  if (target <= 0 || fact <= 0) {
    return false;
  }
  if (fact >= target) {
    return true;
  }
  return macroInGoal(fact, target);
}

/** Above the high side of the band. */
export function macroOverGoal(fact: number, target: number): boolean {
  if (target <= 0 || fact <= target) {
    return false;
  }
  return !macroInGoal(fact, target);
}

/** Grams still short of the target. Zero inside the band or without a target. */
export function macroShortfallGrams(fact: number, target: number): number {
  if (target <= 0 || macroReached(fact, target)) {
    return 0;
  }
  return Math.max(0, target - fact);
}

/**
 * Grams that still fit under the high side of the band.
 * A missing target keeps the old hard stop: any fact leaves no room.
 */
export function macroRoomGrams(fact: number, target: number): number {
  if (target <= 0) {
    return -fact;
  }
  return target * (1 + MACRO_HIT_RATIO) - fact;
}

/** Gram tolerance for UI copy (bot «ещё …») at a given target. */
export function macroGoalToleranceGrams(target: number): number {
  if (target <= 0) {
    return 0;
  }
  return target * MACRO_HIT_RATIO;
}
