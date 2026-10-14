import { formatGrams, formatKcal } from "@/lib/nutrition";

export interface BodySide {
  weight: number | null;
  waist: number | null;
  kcal: number | null;
}

export interface LiftPair {
  name: string;
  thenWeight: number;
  nowWeight: number;
}

function mean(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function averageSide(
  rows: readonly {
    body_weight: number | null;
    waist_cm: number | null;
    fact_kcal: number;
  }[],
): BodySide {
  return {
    weight: mean(
      rows
        .map((row) => row.body_weight)
        .filter((value): value is number => value != null && value > 0),
    ),
    waist: mean(
      rows
        .map((row) => row.waist_cm)
        .filter((value): value is number => value != null && value > 0),
    ),
    kcal: mean(rows.map((row) => row.fact_kcal).filter((value) => value > 0)),
  };
}

/** Lifts that show up on both dates. Heaviest current weight first, three at most. */
export function compareLifts(
  thenLifts: readonly { name: string; weight: number }[],
  nowLifts: readonly { name: string; weight: number }[],
): LiftPair[] {
  const nowByName = new Map(nowLifts.map((lift) => [lift.name, lift.weight]));
  return thenLifts
    .flatMap((lift) => {
      const nowWeight = nowByName.get(lift.name);
      if (nowWeight == null || !(lift.weight > 0)) {
        return [];
      }
      return [{ name: lift.name, thenWeight: lift.weight, nowWeight }];
    })
    .sort((left, right) => right.nowWeight - left.nowWeight)
    .slice(0, 3);
}

export function bodyCompareCaption(input: {
  before: BodySide;
  now: BodySide;
  lifts: readonly LiftPair[];
}): string | null {
  const lines = [
    input.before.weight != null && input.now.weight != null
      ? `${formatGrams(input.before.weight)} → ${formatGrams(input.now.weight)} кг`
      : null,
    input.before.waist != null && input.now.waist != null
      ? `талия ${formatGrams(input.before.waist)} → ${formatGrams(input.now.waist)}`
      : null,
    input.before.kcal != null && input.now.kcal != null
      ? `${formatKcal(input.before.kcal)} → ${formatKcal(input.now.kcal)} ккал`
      : null,
    ...input.lifts.map(
      (lift) =>
        `${lift.name} ${formatGrams(lift.thenWeight)} → ${formatGrams(lift.nowWeight)}`,
    ),
  ].filter((line): line is string => line != null);
  return lines.length > 0 ? lines.join(" · ") : null;
}
