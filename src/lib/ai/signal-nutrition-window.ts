import { roundMacros } from "@/lib/ai/compact";
import { formatG, formatKcalPlain } from "@/lib/ai/format";
import type { ReviewAverages } from "@/lib/ai/types";
import { averageMacros } from "@/lib/nutrition-stats";
import type { DayHistoryRow } from "@/lib/types";

const PROTEIN_MISS_G = 20;

export function formatAverageLine(
  label: string,
  stats: ReviewAverages,
): string {
  return `${label} · ${stats.count}: ${formatKcalPlain(stats.fact.kcal)}/${formatKcalPlain(stats.target.kcal)} ккал, белок ${formatG(stats.fact.protein)}/${formatG(stats.target.protein)} г.`;
}

export function halfWindow(days: DayHistoryRow[]): {
  first: ReviewAverages;
  second: ReviewAverages;
} | null {
  if (days.length < 8) {
    return null;
  }

  const sorted = [...days].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const midIndex = Math.floor(sorted.length / 2);
  const first = averageMacros(sorted.slice(0, midIndex));
  const second = averageMacros(sorted.slice(midIndex));
  if (!first || !second || first.count < 3 || second.count < 3) {
    return null;
  }

  return {
    first: {
      count: first.count,
      fact: roundMacros(first.fact),
      target: roundMacros(first.target),
    },
    second: {
      count: second.count,
      fact: roundMacros(second.fact),
      target: roundMacros(second.target),
    },
  };
}

export function worstProteinDays(
  days: DayHistoryRow[],
): Array<{ date: string; miss: number; training: boolean }> {
  return [...days]
    .flatMap((item) => {
      if (item.target_protein <= 0) {
        return [];
      }
      const miss = item.target_protein - item.fact_protein;
      if (miss < PROTEIN_MISS_G) {
        return [];
      }
      return [
        {
          date: item.date,
          miss,
          training: item.is_training_day,
        },
      ];
    })
    .sort((left, right) => right.miss - left.miss)
    .slice(0, 3);
}
