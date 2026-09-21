import { round0, round1 } from "@/lib/ai/format";
import type {
  ReviewAverages,
  ReviewDayRow,
  ReviewMeasure,
  ReviewWeight,
} from "@/lib/ai/types";
import { bodyWeightWindow, weightDelta } from "@/lib/day/body-weight";
import type { Macros } from "@/lib/nutrition";
import type { averageMacros } from "@/lib/nutrition-stats";
import type { DayHistoryRow } from "@/lib/types";

export function compactDay(item: DayHistoryRow): ReviewDayRow {
  return {
    date: item.date,
    training: item.is_training_day,
    protein: round1(item.fact_protein),
    protein_target: round1(item.target_protein),
    fat: round1(item.fact_fat),
    fat_target: round1(item.target_fat),
    carbs: round1(item.fact_carbs),
    carbs_target: round1(item.target_carbs),
    kcal: round0(item.fact_kcal),
    kcal_target: round0(item.target_kcal),
    weight: item.body_weight == null ? null : round1(item.body_weight),
    waist: item.waist_cm == null ? null : round1(item.waist_cm),
  };
}

export function compactWaist(
  days: DayHistoryRow[],
  seed: number | null,
  from: string,
): ReviewMeasure | null {
  const logged = days
    .filter(
      (item): item is DayHistoryRow & { waist_cm: number } =>
        item.waist_cm != null && item.waist_cm > 0,
    )
    .sort((left, right) => left.date.localeCompare(right.date));
  if (logged.length === 0) {
    return null;
  }

  const onStart = logged.find((item) => item.date === from);
  const start =
    onStart != null
      ? onStart.waist_cm
      : seed != null
        ? seed
        : logged[0].waist_cm;
  const end = logged.at(-1)?.waist_cm ?? start;

  return {
    logged: logged.length,
    start: round1(start),
    end: round1(end),
    delta: weightDelta(start, end),
  };
}

export function compactWeight(
  days: DayHistoryRow[],
  seed: number | null,
  from: string,
): ReviewWeight {
  const stats = bodyWeightWindow(days, { seed, from });
  if (!stats) {
    return {
      logged: 0,
      start: null,
      end: null,
      delta: null,
      protein_per_kg: null,
      protein_per_kg_target: null,
    };
  }

  return {
    logged: stats.logged,
    start: stats.start == null ? null : round1(stats.start),
    end: stats.end == null ? null : round1(stats.end),
    delta: stats.delta == null ? null : round1(stats.delta),
    protein_per_kg: stats.protein_per_kg,
    protein_per_kg_target: stats.protein_per_kg_target,
  };
}

export function roundAverages(
  stats: ReturnType<typeof averageMacros>,
): ReviewAverages | null {
  if (!stats) {
    return null;
  }

  return {
    count: stats.count,
    fact: roundMacros(stats.fact),
    target: roundMacros(stats.target),
  };
}

export function roundMacros(macros: Macros): Macros {
  return {
    protein: round1(macros.protein),
    fat: round1(macros.fat),
    carbs: round1(macros.carbs),
    kcal: round0(macros.kcal),
  };
}
