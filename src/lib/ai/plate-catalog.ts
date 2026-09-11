import { round1 } from "@/lib/ai/format";
import {
  PLATE_CATALOG_LIMIT,
  type PlateCatalogEntry,
  type PlateFoodRef,
} from "@/lib/ai/plate-types";

export function rankPlateCatalog<
  T extends { id: string; is_favorite: boolean },
>(all: T[], recent: T[], limit = PLATE_CATALOG_LIMIT): T[] {
  const ranked: T[] = [];
  const seen = new Set<string>();

  function push(food: T) {
    if (ranked.length >= limit || seen.has(food.id)) {
      return;
    }
    seen.add(food.id);
    ranked.push(food);
  }

  for (const food of all) {
    if (food.is_favorite) {
      push(food);
    }
  }
  for (const food of recent) {
    push(food);
  }
  for (const food of all) {
    push(food);
  }

  return ranked;
}

export function compactPlateCatalog(
  foods: PlateFoodRef[],
  limit = PLATE_CATALOG_LIMIT,
): PlateCatalogEntry[] {
  return foods.slice(0, limit).map((food, index) => ({
    i: index,
    n: food.name,
    s: food.state,
    p: round1(food.protein_per_100),
    f: round1(food.fat_per_100),
    c: round1(food.carbs_per_100),
  }));
}

export function toPlateFoodRef(food: {
  id: string;
  name: string;
  state: PlateFoodRef["state"];
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
  default_portion_g: number | null;
  default_portion_label: string | null;
}): PlateFoodRef {
  return {
    id: food.id,
    name: food.name,
    state: food.state,
    protein_per_100: food.protein_per_100,
    fat_per_100: food.fat_per_100,
    carbs_per_100: food.carbs_per_100,
    kcal_per_100: food.kcal_per_100,
    default_portion_g: food.default_portion_g,
    default_portion_label: food.default_portion_label,
  };
}

export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}
