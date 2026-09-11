import type { Macros } from "@/lib/nutrition/macros";
import type { DayHistoryRow } from "@/lib/types";

export const KCAL_HIT_RATIO = 0.1;

export interface MacroAverages {
  count: number;
  fact: Macros;
  target: Macros;
}

export interface NutritionHits {
  proteinHit: number;
  proteinTotal: number;
  kcalHit: number;
  kcalTotal: number;
}

export function averageMacros(items: DayHistoryRow[]): MacroAverages | null {
  if (items.length === 0) {
    return null;
  }

  const count = items.length;
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let kcal = 0;
  let targetProtein = 0;
  let targetFat = 0;
  let targetCarbs = 0;
  let targetKcal = 0;

  for (const item of items) {
    protein += item.fact_protein;
    fat += item.fact_fat;
    carbs += item.fact_carbs;
    kcal += item.fact_kcal;
    targetProtein += item.target_protein;
    targetFat += item.target_fat;
    targetCarbs += item.target_carbs;
    targetKcal += item.target_kcal;
  }

  return {
    count,
    fact: {
      protein: protein / count,
      fat: fat / count,
      carbs: carbs / count,
      kcal: kcal / count,
    },
    target: {
      protein: targetProtein / count,
      fat: targetFat / count,
      carbs: targetCarbs / count,
      kcal: targetKcal / count,
    },
  };
}

export function splitAverages(items: DayHistoryRow[]): {
  rest: MacroAverages | null;
  training: MacroAverages | null;
} {
  const rest: DayHistoryRow[] = [];
  const training: DayHistoryRow[] = [];

  for (const item of items) {
    if (item.is_training_day) {
      training.push(item);
    } else {
      rest.push(item);
    }
  }

  return {
    rest: averageMacros(rest),
    training: averageMacros(training),
  };
}

export function nutritionHits(items: DayHistoryRow[]): NutritionHits {
  let proteinHit = 0;
  let proteinTotal = 0;
  let kcalHit = 0;
  let kcalTotal = 0;

  for (const item of items) {
    if (item.target_protein > 0) {
      proteinTotal += 1;
      if (item.fact_protein >= item.target_protein) {
        proteinHit += 1;
      }
    }

    if (item.target_kcal > 0) {
      kcalTotal += 1;
      const delta =
        Math.abs(item.fact_kcal - item.target_kcal) / item.target_kcal;
      if (delta <= KCAL_HIT_RATIO) {
        kcalHit += 1;
      }
    }
  }

  return { proteinHit, proteinTotal, kcalHit, kcalTotal };
}
