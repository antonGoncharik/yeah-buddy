import { round0 } from "@/lib/ai/format";
import { foodNameStem, normalizeFoodName } from "@/lib/ai/plate-catalog";
import {
  PLATE_GRAMS_MAX,
  PLATE_ITEM_LIMIT,
  type PlateDraftItem,
  type PlateFoodRef,
  type PlateModelItem,
} from "@/lib/ai/plate-types";
import { parseFoodYield } from "@/lib/food/yield";
import { calcKcalFromMacros } from "@/lib/nutrition";

export function roundPlateGrams(grams: number): number {
  if (!Number.isFinite(grams) || grams <= 0) {
    return 0;
  }

  const clamped = Math.min(grams, PLATE_GRAMS_MAX);
  if (clamped < 10) {
    return Math.max(1, round0(clamped));
  }

  return Math.min(PLATE_GRAMS_MAX, Math.round(clamped / 5) * 5);
}

export function resolvePlateItems(
  raw: PlateModelItem[],
  catalog: PlateFoodRef[],
  allFoods: PlateFoodRef[] = catalog,
): PlateDraftItem[] {
  const items: PlateDraftItem[] = [];
  const seen = new Set<string>();

  for (const row of raw) {
    if (items.length >= PLATE_ITEM_LIMIT) {
      break;
    }

    const grams = roundPlateGrams(row.grams);
    if (grams <= 0) {
      continue;
    }

    const matched = matchCatalogFood(row, catalog, allFoods);
    const item = matched
      ? draftFromFood(preferSourceFood(matched, allFoods), grams)
      : draftFromNew(row, grams);
    if (!item) {
      continue;
    }

    const key = draftKey(item);
    if (seen.has(key)) {
      const existing = items.find((entry) => draftKey(entry) === key);
      if (existing) {
        existing.grams = roundPlateGrams(existing.grams + item.grams);
      }
      continue;
    }

    seen.add(key);
    items.push(item);
  }

  return items;
}

function matchCatalogFood(
  row: PlateModelItem,
  catalog: PlateFoodRef[],
  allFoods: PlateFoodRef[],
): PlateFoodRef | null {
  if (Number.isInteger(row.catalog_i) && catalog[row.catalog_i]) {
    return catalog[row.catalog_i];
  }

  const needle = normalizeFoodName(row.name);
  if (!needle) {
    return null;
  }

  const exact = allFoods.filter(
    (food) => normalizeFoodName(food.name) === needle,
  );
  if (exact.length === 1) {
    return exact[0];
  }

  return null;
}

function draftFromFood(food: PlateFoodRef, grams: number): PlateDraftItem {
  return {
    kind: "food",
    foodId: food.id,
    name: food.name,
    state: food.state,
    grams,
    protein_per_100: food.protein_per_100,
    fat_per_100: food.fat_per_100,
    carbs_per_100: food.carbs_per_100,
    kcal_per_100: food.kcal_per_100,
    default_portion_g: food.default_portion_g,
    default_portion_label: food.default_portion_label,
    yield_from_g: food.yield_from_g,
    yield_to_g: food.yield_to_g,
  };
}

function preferSourceFood(
  matched: PlateFoodRef,
  allFoods: PlateFoodRef[],
): PlateFoodRef {
  if (matched.state !== "cooked") {
    return matched;
  }

  const stem = foodNameStem(matched.name);
  if (!stem) {
    return matched;
  }

  const sources = allFoods.filter((food) => {
    if (food.id === matched.id) {
      return false;
    }
    if (!parseFoodYield(food)) {
      return false;
    }
    return foodNameStem(food.name) === stem;
  });

  return sources.length === 1 ? sources[0] : matched;
}

function draftFromNew(
  row: PlateModelItem,
  grams: number,
): PlateDraftItem | null {
  if (
    row.protein_per_100 == null ||
    row.fat_per_100 == null ||
    row.carbs_per_100 == null
  ) {
    return null;
  }

  const protein = clampMacro(row.protein_per_100);
  const fat = clampMacro(row.fat_per_100);
  const carbs = clampMacro(row.carbs_per_100);
  const name = row.name.trim();
  if (name === "") {
    return null;
  }

  return {
    kind: "new",
    name: name.slice(0, 80),
    state: row.state,
    grams,
    protein_per_100: protein,
    fat_per_100: fat,
    carbs_per_100: carbs,
    kcal_per_100: calcKcalFromMacros(protein, fat, carbs),
  };
}

function clampMacro(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(100, Math.round(value * 10) / 10);
}

function draftKey(item: PlateDraftItem): string {
  if (item.kind === "food") {
    return `food:${item.foodId}`;
  }

  return [
    "new",
    normalizeFoodName(item.name),
    item.state,
    item.protein_per_100,
    item.fat_per_100,
    item.carbs_per_100,
  ].join("|");
}
