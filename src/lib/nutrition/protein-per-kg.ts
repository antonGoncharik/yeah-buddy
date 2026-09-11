import {
  carriedBodyWeight,
  proteinPerKg,
  roundBodyWeight,
} from "@/lib/day/body-weight";
import type { DayHistoryRow } from "@/lib/types";

export interface ProteinPerKgStats {
  count: number;
  fact: number;
  target: number;
}

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
