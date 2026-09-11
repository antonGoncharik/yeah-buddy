import { round1 } from "@/lib/ai/format";
import {
  PLATE_CATALOG_LIMIT,
  type PlateCatalogEntry,
  type PlateFoodRef,
} from "@/lib/ai/plate-types";

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

export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}
