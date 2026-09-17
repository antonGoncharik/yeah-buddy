import { roundMacros } from "@/lib/ai/compact-nutrition";
import { formatG, formatKcalPlain } from "@/lib/ai/format";
import type { ReviewAverages } from "@/lib/ai/types";
import { inclusiveDayCount, longestDateGap } from "@/lib/day/dates";
import { averageMacros, KCAL_HIT_RATIO } from "@/lib/nutrition-stats";
import type { DayHistoryRow } from "@/lib/types";

export { inclusiveDayCount };

const PROTEIN_MISS_G = 20;
const KCAL_MISS = 150;
const LOG_GAP_DAYS = 3;

export function formatAverageLine(
  label: string,
  stats: ReviewAverages,
): string {
  return `${label} · ${stats.count}: ${formatKcalPlain(stats.fact.kcal)}/${formatKcalPlain(stats.target.kcal)} ккал, белок ${formatG(stats.fact.protein)}/${formatG(stats.target.protein)} г, жир ${formatG(stats.fact.fat)}/${formatG(stats.target.fat)} г, углеводы ${formatG(stats.fact.carbs)}/${formatG(stats.target.carbs)} г.`;
}

export function longestLogGap(
  from: string,
  to: string,
  dates: string[],
): number {
  return longestDateGap(from, to, dates);
}

export function logCoverageLine(
  windowDays: number,
  logged: number,
  from: string,
  to: string,
  dates: string[],
): string | null {
  if (windowDays < 7 || logged <= 0) {
    return null;
  }

  const parts: string[] = [];
  if (logged < windowDays - 1) {
    parts.push(`записана ${logged} из ${windowDays} дней`);
  }
  const gap = longestLogGap(from, to, dates);
  if (gap >= LOG_GAP_DAYS) {
    parts.push(`дыра ${gap} дн.`);
  }
  if (parts.length === 0) {
    return null;
  }
  return `Еда: ${parts.join(", ")}.`;
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

export function worstKcalDays(
  days: DayHistoryRow[],
): Array<{ date: string; miss: number; training: boolean }> {
  return [...days]
    .flatMap((item) => {
      if (item.target_kcal <= 0) {
        return [];
      }
      const miss = item.target_kcal - item.fact_kcal;
      if (
        miss < KCAL_MISS ||
        item.fact_kcal >= item.target_kcal * (1 - KCAL_HIT_RATIO)
      ) {
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
