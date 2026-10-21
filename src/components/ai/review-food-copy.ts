import type { ReviewBrief, ReviewDayRow } from "@/lib/ai/types";
import { formatKcal } from "@/lib/nutrition/macros";
import type { DayHistoryRow } from "@/lib/types";

type FoodBrief = Pick<ReviewBrief, "nutrition">;

export function signedAmount(
  delta: number,
  format: (value: number) => string,
): string {
  const text = format(Math.abs(delta));
  if (delta > 0) {
    return `+${text}`;
  }
  if (delta < 0) {
    return `−${text}`;
  }
  return text;
}

export function foodValue(brief: FoodBrief): string | null {
  if (brief.nutrition.protein_total > 0) {
    return `белок ${brief.nutrition.protein_hit} из ${brief.nutrition.protein_total}`;
  }
  if (brief.nutrition.kcal_total > 0) {
    return `ккал ${brief.nutrition.kcal_hit} из ${brief.nutrition.kcal_total}`;
  }
  return null;
}

export function foodSummary(brief: FoodBrief): string | null {
  const hasProtein = brief.nutrition.protein_total > 0;
  const hasKcal = brief.nutrition.kcal_total > 0;
  if (hasProtein && hasKcal) {
    return `ккал ${brief.nutrition.kcal_hit} из ${brief.nutrition.kcal_total}`;
  }
  if (hasProtein) {
    return "белок";
  }
  if (hasKcal) {
    return "ккал";
  }
  return null;
}

export function averageValue(brief: FoodBrief): string | null {
  if (brief.nutrition.training) {
    return formatKcal(brief.nutrition.training.fact.kcal);
  }
  if (brief.nutrition.rest) {
    return formatKcal(brief.nutrition.rest.fact.kcal);
  }
  return null;
}

export function averageSummary(brief: FoodBrief): string | null {
  if (brief.nutrition.training && brief.nutrition.rest) {
    return `тренировка · отдых ${formatKcal(brief.nutrition.rest.fact.kcal)}`;
  }
  if (brief.nutrition.training) {
    return "тренировка";
  }
  if (brief.nutrition.rest) {
    return "отдых";
  }
  const top = brief.nutrition.foods[0];
  return top ? top.name : null;
}

export function historyDays(days: ReviewDayRow[]): DayHistoryRow[] {
  return days.map((day) => ({
    date: day.date,
    is_training_day: day.training,
    target_protein: day.protein_target,
    target_fat: day.fat_target,
    target_carbs: day.carbs_target,
    target_kcal: day.kcal_target,
    body_weight: day.weight,
    waist_cm: day.waist,
    caught_up: false,
    fact_protein: day.protein,
    fact_fat: day.fat,
    fact_carbs: day.carbs,
    fact_kcal: day.kcal,
  }));
}
