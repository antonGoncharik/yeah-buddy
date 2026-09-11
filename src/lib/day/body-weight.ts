export const BODY_WEIGHT_MIN = 20;
export const BODY_WEIGHT_MAX = 400;

export function roundBodyWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export function parseBodyWeight(
  value: number | null | undefined,
): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  const rounded = roundBodyWeight(value);
  if (rounded < BODY_WEIGHT_MIN || rounded > BODY_WEIGHT_MAX) {
    return null;
  }

  return rounded;
}

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

export function proteinPerKg(
  protein: number,
  bodyWeight: number,
): number | null {
  if (!(bodyWeight > 0) || !Number.isFinite(protein)) {
    return null;
  }

  return Math.round((protein / bodyWeight) * 10) / 10;
}

export function formatBodyWeight(value: number): string {
  const rounded = roundBodyWeight(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatProteinPerKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text.replace(".", ",")} г/кг`;
}

export function formatRelative(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/0$/, "");
  return `${text.replace(".", ",")}×`;
}

export function formatSignedBodyWeight(value: number): string {
  const abs = formatBodyWeight(Math.abs(value));
  if (value > 0) {
    return `+${abs}`;
  }
  if (value < 0) {
    return `−${abs}`;
  }
  return formatBodyWeight(0);
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
