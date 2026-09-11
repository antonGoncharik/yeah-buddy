import { format, parseISO, subDays } from "date-fns";
import {
  carriedBodyWeight,
  proteinPerKg,
  roundBodyWeight,
} from "@/lib/day/body-weight";

import type { Macros } from "@/lib/nutrition";
import type { DayHistoryRow } from "@/lib/types";

export const KCAL_HIT_RATIO = 0.1;

export type NutritionRange = 14 | 30;

export function isNutritionRange(value: number): value is NutritionRange {
  return value === 14 || value === 30;
}

export type NutritionMetric = "protein" | "fat" | "carbs" | "kcal";

export type MacroAverages = {
  count: number;
  fact: Macros;
  target: Macros;
};

export type NutritionHits = {
  proteinHit: number;
  proteinTotal: number;
  kcalHit: number;
  kcalTotal: number;
};

export function windowDays(
  items: DayHistoryRow[],
  days: NutritionRange,
  todayIso: string,
): DayHistoryRow[] {
  const start = rangeStart(todayIso, days);
  if (!start) {
    return [];
  }

  return items.filter((item) => item.date >= start && item.date <= todayIso);
}

export function hasOlderThanRange(
  items: DayHistoryRow[],
  days: NutritionRange,
  todayIso: string,
): boolean {
  const start = rangeStart(todayIso, days);
  if (!start) {
    return false;
  }

  return items.some((item) => item.date < start);
}

export function chronological(items: DayHistoryRow[]): DayHistoryRow[] {
  return [...items].reverse();
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

export type ProteinPerKgStats = {
  count: number;
  fact: number;
  target: number;
};

export function proteinPerKgStats(
  items: DayHistoryRow[],
  seed: number | null = null,
): ProteinPerKgStats | null {
  const carried = carriedBodyWeight(items, seed);
  let fact = 0;
  let target = 0;
  let count = 0;

  for (const item of items) {
    const weight = carried.get(item.date);
    if (weight == null) {
      continue;
    }
    const factPerKg = proteinPerKg(item.fact_protein, weight);
    const targetPerKg = proteinPerKg(item.target_protein, weight);
    if (factPerKg == null || targetPerKg == null) {
      continue;
    }
    fact += factPerKg;
    target += targetPerKg;
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return {
    count,
    fact: roundBodyWeight(fact / count),
    target: roundBodyWeight(target / count),
  };
}

export function metricFact(
  item: DayHistoryRow,
  metric: NutritionMetric,
): number {
  switch (metric) {
    case "protein":
      return item.fact_protein;
    case "fat":
      return item.fact_fat;
    case "carbs":
      return item.fact_carbs;
    case "kcal":
      return item.fact_kcal;
  }
}

export function metricTarget(
  item: DayHistoryRow,
  metric: NutritionMetric,
): number {
  switch (metric) {
    case "protein":
      return item.target_protein;
    case "fat":
      return item.target_fat;
    case "carbs":
      return item.target_carbs;
    case "kcal":
      return item.target_kcal;
  }
}

export function pluralDays(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return "дней";
  }
  if (mod10 === 1) {
    return "день";
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return "дня";
  }
  return "дней";
}

function rangeStart(todayIso: string, days: NutritionRange): string | null {
  try {
    return format(subDays(parseISO(todayIso), days - 1), "yyyy-MM-dd");
  } catch {
    return null;
  }
}
