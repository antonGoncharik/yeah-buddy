import type { DayHistoryRow } from "@/lib/types";

export type NutritionMetric = "protein" | "fat" | "carbs" | "kcal";

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
