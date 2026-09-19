import { formatYieldGrams, parseFoodYield } from "@/lib/food/yield";
import type { Food } from "@/lib/types";

export function quickAddGrams(
  food: Pick<
    Food,
    "default_portion_g" | "state" | "yield_from_g" | "yield_to_g"
  >,
): number | null {
  const grams = food.default_portion_g;
  if (grams == null || !(grams > 0) || !Number.isFinite(grams)) {
    return null;
  }
  if (
    parseFoodYield({
      state: food.state,
      yield_from_g: food.yield_from_g,
      yield_to_g: food.yield_to_g,
    })
  ) {
    return null;
  }
  return grams;
}

export function quickAddPortionLabel(
  food: Pick<
    Food,
    | "default_portion_g"
    | "default_portion_label"
    | "state"
    | "yield_from_g"
    | "yield_to_g"
  >,
): string | null {
  const grams = quickAddGrams(food);
  if (grams == null) {
    return null;
  }
  const label = food.default_portion_label?.trim();
  if (label) {
    return label;
  }
  return `${formatYieldGrams(grams)} г`;
}
