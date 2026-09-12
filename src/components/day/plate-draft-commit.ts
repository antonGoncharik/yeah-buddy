import { rowNativeGrams } from "@/components/day/plate-draft";
import type { PlateRow } from "@/components/day/plate-draft-types";
import { parseNonneg } from "@/components/foods/food-form-state";
import { PLATE_GRAMS_MAX, type PlateDraftItem } from "@/lib/ai/plate-types";
import { CHECK_FIELDS } from "@/lib/messages";
import { calcKcalFromMacros } from "@/lib/nutrition";

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

export function commitItemsFromRows(
  items: PlateRow[],
): { ok: true; items: PlateDraftItem[] } | { ok: false; message: string } {
  const next: PlateDraftItem[] = [];
  for (const item of items) {
    const native = rowNativeGrams(item);
    if (native == null) {
      return { ok: false, message: "Нужны граммы больше 0." };
    }
    const grams = Math.min(native, PLATE_GRAMS_MAX);
    if (item.kind === "new") {
      const protein = parseNonneg(item.proteinInput);
      const fat = parseNonneg(item.fatInput);
      const carbs = parseNonneg(item.carbsInput);
      if (
        item.name.trim() === "" ||
        protein == null ||
        fat == null ||
        carbs == null
      ) {
        return { ok: false, message: CHECK_FIELDS };
      }
      next.push({
        ...item,
        name: item.name.trim(),
        grams,
        protein_per_100: protein,
        fat_per_100: fat,
        carbs_per_100: carbs,
        kcal_per_100: calcKcalFromMacros(protein, fat, carbs),
      });
      continue;
    }
    next.push({ ...item, grams });
  }

  return { ok: true, items: next };
}
