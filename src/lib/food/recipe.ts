import { roundYieldGrams } from "@/lib/food/yield";
import { calcKcalFromMacros, type Macros, roundMacros } from "@/lib/nutrition";

const COOKED_MIN_RATIO = 0.15;
const COOKED_MAX_RATIO = 5;
const MACRO_CAP = 100;

export interface RecipeLine {
  grams: number;
  proteinPer100: number;
  fatPer100: number;
  carbsPer100: number;
}

/** One serving of a cooked pot. Two to four servings split the cooked weight. */
export function recipePortion(
  cookedGrams: number,
  portions: number,
): { grams: number; label: string } | null {
  if (!(cookedGrams > 0) || portions < 1 || portions > 4) {
    return null;
  }
  const grams = roundYieldGrams(cookedGrams / portions);
  if (!(grams > 0)) {
    return null;
  }
  return {
    grams,
    label: portions === 1 ? "1 порция" : `1/${portions} кастрюли`,
  };
}

export function recipeRawGrams(lines: readonly RecipeLine[]): number {
  return roundYieldGrams(
    lines.reduce((sum, line) => sum + (line.grams > 0 ? line.grams : 0), 0),
  );
}

/** Cooked weight wins. A shrink percent is the frying shortcut. Empty means no loss. */
export function recipeCookedGrams(input: {
  rawGrams: number;
  cookedGrams: number | null;
  shrinkPercent: number | null;
}): number | null {
  if (!(input.rawGrams > 0)) {
    return null;
  }
  if (input.cookedGrams != null && input.cookedGrams > 0) {
    const cooked = roundYieldGrams(input.cookedGrams);
    if (
      cooked < input.rawGrams * COOKED_MIN_RATIO ||
      cooked > input.rawGrams * COOKED_MAX_RATIO
    ) {
      return null;
    }
    return cooked;
  }
  if (
    input.shrinkPercent != null &&
    input.shrinkPercent > 0 &&
    input.shrinkPercent < 80
  ) {
    return roundYieldGrams(input.rawGrams * (1 - input.shrinkPercent / 100));
  }
  return roundYieldGrams(input.rawGrams);
}

export function recipePer100(
  lines: readonly RecipeLine[],
  cookedGrams: number,
): Macros | null {
  if (!(cookedGrams > 0)) {
    return null;
  }
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  for (const line of lines) {
    if (!(line.grams > 0)) {
      continue;
    }
    const scale = line.grams / 100;
    protein += line.proteinPer100 * scale;
    fat += line.fatPer100 * scale;
    carbs += line.carbsPer100 * scale;
  }
  const per100 = roundMacros({
    protein: (protein / cookedGrams) * 100,
    fat: (fat / cookedGrams) * 100,
    carbs: (carbs / cookedGrams) * 100,
    kcal: 0,
  });
  if (
    per100.protein > MACRO_CAP ||
    per100.fat > MACRO_CAP ||
    per100.carbs > MACRO_CAP
  ) {
    return null;
  }
  return {
    ...per100,
    kcal: calcKcalFromMacros(per100.protein, per100.fat, per100.carbs),
  };
}
