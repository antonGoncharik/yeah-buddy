import { parseNonneg } from "@/components/foods/food-form-state";
import { PLATE_GRAMS_MAX, type PlateDraftItem } from "@/lib/ai/plate-types";
import { calcKcalFromMacros } from "@/lib/nutrition";
import type { Food, FoodState } from "@/lib/types";

export type PlateRow = PlateDraftItem & {
  rowId: string;
  gramsInput: string;
  proteinInput: string;
  fatInput: string;
  carbsInput: string;
};

export type PlatePicker =
  | { mode: "add" }
  | { mode: "replace"; index: number }
  | null;

export type PlateStatus =
  | { status: "idle" }
  | { status: "unavailable" }
  | { status: "working"; title: string; previewUrl: string | null }
  | { status: "error"; message: string; previewUrl: string | null }
  | { status: "empty"; previewUrl: string }
  | { status: "draft"; previewUrl: string; items: PlateRow[] }
  | { status: "saving"; previewUrl: string; items: PlateRow[] };

export type PlateNewPatch = {
  name?: string;
  state?: FoodState;
  proteinInput?: string;
  fatInput?: string;
  carbsInput?: string;
};

export function parseGramsInput(value: string): number | null {
  const grams = Number(value.replace(",", "."));
  if (!Number.isFinite(grams) || grams <= 0) {
    return null;
  }
  return grams;
}

export function toPlateRow(item: PlateDraftItem): PlateRow {
  return {
    ...item,
    rowId: crypto.randomUUID(),
    gramsInput: String(item.grams),
    proteinInput: String(item.protein_per_100),
    fatInput: String(item.fat_per_100),
    carbsInput: String(item.carbs_per_100),
  };
}

export function foodToPlateRow(food: Food, grams: number): PlateRow {
  return toPlateRow({
    kind: "food",
    foodId: food.id,
    name: food.name,
    grams,
    protein_per_100: food.protein_per_100,
    fat_per_100: food.fat_per_100,
    carbs_per_100: food.carbs_per_100,
    kcal_per_100: food.kcal_per_100,
    default_portion_g: food.default_portion_g,
    default_portion_label: food.default_portion_label,
  });
}

export function mergeFoodRows(items: PlateRow[]): PlateRow[] {
  const merged: PlateRow[] = [];
  for (const item of items) {
    if (item.kind !== "food") {
      merged.push(item);
      continue;
    }
    const existing = merged.find(
      (entry) => entry.kind === "food" && entry.foodId === item.foodId,
    );
    if (existing?.kind !== "food") {
      merged.push(item);
      continue;
    }
    const grams =
      (parseGramsInput(existing.gramsInput) ?? 0) +
      (parseGramsInput(item.gramsInput) ?? 0);
    const next = grams > 0 ? grams : existing.grams;
    existing.grams = Math.min(next, PLATE_GRAMS_MAX);
    existing.gramsInput = String(existing.grams);
  }
  return merged;
}

export function patchNewFoodRow(
  item: PlateRow,
  patch: PlateNewPatch,
): PlateRow {
  if (item.kind !== "new") {
    return item;
  }
  const proteinInput = patch.proteinInput ?? item.proteinInput;
  const fatInput = patch.fatInput ?? item.fatInput;
  const carbsInput = patch.carbsInput ?? item.carbsInput;
  const protein = parseNonneg(proteinInput) ?? item.protein_per_100;
  const fat = parseNonneg(fatInput) ?? item.fat_per_100;
  const carbs = parseNonneg(carbsInput) ?? item.carbs_per_100;
  return {
    ...item,
    name: patch.name ?? item.name,
    state: patch.state ?? item.state,
    proteinInput,
    fatInput,
    carbsInput,
    protein_per_100: protein,
    fat_per_100: fat,
    carbs_per_100: carbs,
    kcal_per_100: calcKcalFromMacros(protein, fat, carbs),
  };
}

export function toCommitItem(item: PlateDraftItem) {
  if (item.kind === "food") {
    return { kind: "food" as const, foodId: item.foodId, grams: item.grams };
  }

  return {
    kind: "new" as const,
    name: item.name,
    state: item.state,
    protein_per_100: item.protein_per_100,
    fat_per_100: item.fat_per_100,
    carbs_per_100: item.carbs_per_100,
    grams: item.grams,
  };
}

export function foodRowFromPick(food: Food): PlateRow {
  const grams =
    food.default_portion_g && food.default_portion_g > 0
      ? food.default_portion_g
      : 100;
  return foodToPlateRow(food, grams);
}
