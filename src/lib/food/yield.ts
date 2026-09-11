import type { FoodState } from "@/lib/types";

export const YIELD_SOURCE_STATES = ["raw", "dry"] as const;

export type YieldSourceState = (typeof YIELD_SOURCE_STATES)[number];

export type GramsMode = "native" | "cooked";

export interface FoodYield {
  from_g: number;
  to_g: number;
}

export function isYieldSourceState(value: unknown): value is YieldSourceState {
  return value === "raw" || value === "dry";
}

export function nativeYieldLabel(state: FoodState | string): string {
  return state === "dry" ? "Сухое" : "Сырое";
}

export function parseFoodYield(input: {
  state?: string | null;
  yield_from_g?: number | null;
  yield_to_g?: number | null;
}): FoodYield | null {
  if (!isYieldSourceState(input.state)) {
    return null;
  }

  return parseYieldPair(input.yield_from_g, input.yield_to_g);
}

export function parseYieldPair(
  from: number | null | undefined,
  to: number | null | undefined,
): FoodYield | null {
  if (from == null || to == null) {
    return null;
  }
  if (
    !(from > 0) ||
    !(to > 0) ||
    !Number.isFinite(from) ||
    !Number.isFinite(to)
  ) {
    return null;
  }

  return { from_g: from, to_g: to };
}

export function roundYieldGrams(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatYieldGrams(value: number): string {
  const rounded = roundYieldGrams(value);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function convertYieldGrams(
  grams: number,
  from: number,
  to: number,
): number {
  if (!(grams > 0) || !(from > 0) || !(to > 0)) {
    return 0;
  }

  return roundYieldGrams((grams * to) / from);
}

export function toCookedGrams(nativeGrams: number, pair: FoodYield): number {
  return convertYieldGrams(nativeGrams, pair.from_g, pair.to_g);
}

export function toNativeGrams(
  grams: number,
  mode: GramsMode,
  pair: FoodYield | null,
): number {
  if (!(grams > 0)) {
    return 0;
  }
  if (mode === "cooked" && pair) {
    return convertYieldGrams(grams, pair.to_g, pair.from_g);
  }

  return roundYieldGrams(grams);
}
