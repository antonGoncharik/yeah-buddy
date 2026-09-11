import { round0, round1 } from "@/lib/ai/format";
import type {
  ReviewAverages,
  ReviewDayRow,
  ReviewWeight,
} from "@/lib/ai/types";
import { bodyWeightWindow } from "@/lib/day/body-weight";
import type { Macros } from "@/lib/nutrition";
import type { averageMacros } from "@/lib/nutrition-stats";
import type { DayHistoryRow } from "@/lib/types";

export function compactDay(item: DayHistoryRow): ReviewDayRow {
  return {
    date: item.date,
    training: item.is_training_day,
    protein: round1(item.fact_protein),
    protein_target: round1(item.target_protein),
    carbs: round1(item.fact_carbs),
    carbs_target: round1(item.target_carbs),
    kcal: round0(item.fact_kcal),
    kcal_target: round0(item.target_kcal),
    weight: item.body_weight == null ? null : round1(item.body_weight),
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
