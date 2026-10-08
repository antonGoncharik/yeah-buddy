import { quickAddGrams } from "@/lib/food/quick-add";
import type { Food } from "@/lib/types";

/** Recent first, then favorites; only foods that log in one tap. */
export function frequentQuickAddFoods(
  recent: ReadonlyArray<Food>,
  favorites: ReadonlyArray<Food>,
  limit = 10,
): Food[] {
  const seen = new Set<string>();
  const out: Food[] = [];

  for (const food of [...recent, ...favorites]) {
    if (seen.has(food.id)) {
      continue;
    }
    if (quickAddGrams(food) == null) {
      continue;
    }
    seen.add(food.id);
    out.push(food);
    if (out.length >= limit) {
      break;
    }
  }

  return out;
}
