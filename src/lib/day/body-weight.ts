import { roundBodyWeight } from "@/lib/day/body-weight-format";

export {
  BODY_WEIGHT_MAX,
  BODY_WEIGHT_MIN,
  formatBodyWeight,
  formatProteinPerKg,
  formatRelative,
  formatSignedBodyWeight,
  parseBodyWeight,
  roundBodyWeight,
} from "@/lib/day/body-weight-format";

export function bodyWeightOnOrBefore(
  weights: Array<{ date: string; weight: number }>,
  date: string,
): number | null {
  let found: number | null = null;
  for (const row of weights) {
    if (row.date > date) {
      break;
    }
    found = row.weight;
  }
  return found;
}

export function carriedBodyWeight(
  days: Array<{ date: string; body_weight: number | null }>,
  seed: number | null = null,
): Map<string, number> {
  const sorted = [...days].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const byDate = new Map<string, number>();
  let last: number | null = seed != null && seed > 0 ? seed : null;

  for (const day of sorted) {
    if (day.body_weight != null && day.body_weight > 0) {
      last = day.body_weight;
    }
    if (last != null) {
      byDate.set(day.date, last);
    }
  }

  return byDate;
}

export function relativeStrength(
  barWeight: number,
  bodyWeight: number,
): number | null {
  if (!(barWeight > 0) || !(bodyWeight > 0)) {
    return null;
  }

  return Math.round((barWeight / bodyWeight) * 100) / 100;
}

export function historyWeightPoints(
  days: Array<{ date: string; body_weight: number | null }>,
): Array<{ date: string; weight: number }> {
  return days.flatMap((day) =>
    day.body_weight != null && day.body_weight > 0
      ? [{ date: day.date, weight: day.body_weight }]
      : [],
  );
}

export function proteinPerKg(
  protein: number,
  bodyWeight: number,
): number | null {
  if (!(bodyWeight > 0) || !Number.isFinite(protein)) {
    return null;
  }

  return Math.round((protein / bodyWeight) * 10) / 10;
}

export type BodyWeightWindow = {
  logged: number;
  start: number | null;
  end: number | null;
  delta: number | null;
  protein_per_kg: number | null;
  protein_per_kg_target: number | null;
};

export function bodyWeightWindow(
  days: Array<{
    date: string;
    body_weight: number | null;
    fact_protein: number;
    target_protein: number;
  }>,
  options?: { seed?: number | null; from?: string | null },
): BodyWeightWindow | null {
  const seed = options?.seed != null && options.seed > 0 ? options.seed : null;
  const from = options?.from ?? null;
  const logged = days
    .filter(
      (item): item is typeof item & { body_weight: number } =>
        item.body_weight != null && item.body_weight > 0,
    )
    .sort((left, right) => left.date.localeCompare(right.date));
  const carried = carriedBodyWeight(days, seed);
  let proteinSum = 0;
  let targetSum = 0;
  let perKgCount = 0;

  for (const day of days) {
    const body = carried.get(day.date);
    if (body == null) {
      continue;
    }
    const fact = proteinPerKg(day.fact_protein, body);
    const target = proteinPerKg(day.target_protein, body);
    if (fact == null || target == null) {
      continue;
    }
    proteinSum += fact;
    targetSum += target;
    perKgCount += 1;
  }

  if (logged.length === 0 && perKgCount === 0) {
    return null;
  }

  const start = windowStartWeight(logged, seed, from);
  const end = logged.at(-1)?.body_weight ?? seed;
  return {
    logged: logged.length,
    start,
    end,
    delta: weightDelta(start, end),
    protein_per_kg:
      perKgCount === 0 ? null : Math.round((proteinSum / perKgCount) * 10) / 10,
    protein_per_kg_target:
      perKgCount === 0 ? null : Math.round((targetSum / perKgCount) * 10) / 10,
  };
}

function windowStartWeight(
  logged: Array<{ date: string; body_weight: number }>,
  seed: number | null,
  from: string | null,
): number | null {
  if (from != null) {
    const onStart = logged.find((item) => item.date === from);
    if (onStart) {
      return onStart.body_weight;
    }
    if (seed != null) {
      return seed;
    }
  }

  return logged[0]?.body_weight ?? seed;
}

export function weightDelta(
  start: number | null,
  end: number | null,
): number | null {
  if (start == null || end == null) {
    return null;
  }

  return roundBodyWeight(end - start);
}
