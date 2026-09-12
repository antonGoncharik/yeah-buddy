import { round0 } from "@/lib/ai/format";
import { foodNameStem, normalizeFoodName } from "@/lib/ai/plate-catalog";
import {
  PLATE_GRAMS_MAX,
  PLATE_ITEM_LIMIT,
  type PlateDraftItem,
  type PlateDraftLump,
  type PlateFoodRef,
  type PlateModelItem,
} from "@/lib/ai/plate-types";
import {
  LUMP_MACRO_MAX,
  type LumpMealItemInput,
  macrosFromLump,
} from "@/lib/day/lump";
import { parseFoodYield } from "@/lib/food/yield";

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

    const matched = matchCatalogFood(row, catalog, allFoods);
    const item = matched
      ? draftFromFood(preferSourceFood(matched, allFoods), row.grams)
      : draftFromLump(row);
    if (!item) {
      continue;
    }

    const key = draftKey(item);
    if (seen.has(key)) {
      const existing = items.find((entry) => draftKey(entry) === key);
      if (existing) {
        mergeDraftItem(existing, item);
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

function draftFromFood(
  food: PlateFoodRef,
  grams: number,
): PlateDraftItem | null {
  const rounded = roundPlateGrams(grams);
  if (rounded <= 0) {
    return null;
  }

  return {
    kind: "food",
    foodId: food.id,
    name: food.name,
    state: food.state,
    grams: rounded,
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

function draftFromLump(row: PlateModelItem): PlateDraftLump | null {
  const portion = portionFromModel(row);
  if (!portion) {
    return null;
  }

  const name = row.name.trim();
  if (name === "") {
    return null;
  }

  const macros = macrosFromLump(portion);
  if (macros.protein + macros.fat + macros.carbs <= 0) {
    return null;
  }

  return {
    kind: "lump",
    name: name.slice(0, 80),
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
  };
}

function portionFromModel(row: PlateModelItem): LumpMealItemInput | null {
  if (
    row.protein != null &&
    row.fat != null &&
    row.carbs != null &&
    row.protein + row.fat + row.carbs > 0
  ) {
    return clampPortion({
      name: row.name,
      protein: row.protein,
      fat: row.fat,
      carbs: row.carbs,
    });
  }

  if (
    row.protein_per_100 == null ||
    row.fat_per_100 == null ||
    row.carbs_per_100 == null ||
    row.grams <= 0
  ) {
    return null;
  }

  return clampPortion({
    name: row.name,
    protein: (row.protein_per_100 * row.grams) / 100,
    fat: (row.fat_per_100 * row.grams) / 100,
    carbs: (row.carbs_per_100 * row.grams) / 100,
  });
}

function clampPortion(input: LumpMealItemInput): LumpMealItemInput | null {
  if (
    input.protein > LUMP_MACRO_MAX ||
    input.fat > LUMP_MACRO_MAX ||
    input.carbs > LUMP_MACRO_MAX
  ) {
    return null;
  }

  return input;
}

function mergeDraftItem(existing: PlateDraftItem, incoming: PlateDraftItem) {
  if (existing.kind === "food" && incoming.kind === "food") {
    existing.grams = roundPlateGrams(existing.grams + incoming.grams);
    return;
  }

  if (existing.kind === "lump" && incoming.kind === "lump") {
    const macros = macrosFromLump({
      protein: existing.protein + incoming.protein,
      fat: existing.fat + incoming.fat,
      carbs: existing.carbs + incoming.carbs,
    });
    existing.protein = macros.protein;
    existing.fat = macros.fat;
    existing.carbs = macros.carbs;
    existing.kcal = macros.kcal;
  }
}

function draftKey(item: PlateDraftItem): string {
  if (item.kind === "food") {
    return `food:${item.foodId}`;
  }

  return `lump:${normalizeFoodName(item.name)}`;
}
