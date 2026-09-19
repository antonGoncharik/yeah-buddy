export function chartMean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function chartSpan(
  values: number[],
): { first: number; last: number; delta: number } | null {
  const first = values[0];
  const last = values[values.length - 1];
  if (first == null || last == null) {
    return null;
  }

  return { first, last, delta: last - first };
}

export function countChartHits(
  facts: number[],
  targets: number[],
  mode: "atLeast" | "within",
  ratio = 0.1,
): { hit: number; total: number } | null {
  const count = Math.min(facts.length, targets.length);
  let hit = 0;
  let total = 0;

  for (let index = 0; index < count; index += 1) {
    const fact = facts[index];
    const target = targets[index];
    if (fact == null || target == null || target <= 0) {
      continue;
    }

    total += 1;
    if (mode === "atLeast") {
      if (fact >= target) {
        hit += 1;
      }
      continue;
    }

    if (Math.abs(fact - target) / target <= ratio) {
      hit += 1;
    }
  }

  return total === 0 ? null : { hit, total };
}

export function chartInsight(
  parts: Array<string | null | undefined>,
): string | null {
  const line = parts
    .filter((part): part is string => Boolean(part))
    .join(" · ");
  return line === "" ? null : line;
}
