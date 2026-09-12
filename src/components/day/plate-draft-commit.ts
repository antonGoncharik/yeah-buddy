import { rowNativeGrams } from "@/components/day/plate-draft";
import type { PlateRow } from "@/components/day/plate-draft-types";
import { parseNonneg } from "@/components/foods/food-form-state";
import { PLATE_GRAMS_MAX, type PlateDraftItem } from "@/lib/ai/plate-types";
import { lumpMealItemSchema, macrosFromLump } from "@/lib/day/lump";
import { CHECK_FIELDS } from "@/lib/messages";

export function toCommitItem(item: PlateDraftItem) {
  if (item.kind === "food") {
    return { kind: "food" as const, foodId: item.foodId, grams: item.grams };
  }

  return {
    kind: "lump" as const,
    name: item.name,
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
  };
}

export function commitItemsFromRows(
  items: PlateRow[],
): { ok: true; items: PlateDraftItem[] } | { ok: false; message: string } {
  const next: PlateDraftItem[] = [];
  for (const item of items) {
    if (item.kind === "lump") {
      const protein = parseNonneg(item.proteinInput);
      const fat = parseNonneg(item.fatInput);
      const carbs = parseNonneg(item.carbsInput);
      const parsed = lumpMealItemSchema.safeParse({
        name: item.name,
        protein,
        fat,
        carbs,
      });
      if (!parsed.success || protein == null || fat == null || carbs == null) {
        return { ok: false, message: CHECK_FIELDS };
      }
      const macros = macrosFromLump(parsed.data);
      next.push({
        kind: "lump",
        name: parsed.data.name,
        protein: macros.protein,
        fat: macros.fat,
        carbs: macros.carbs,
        kcal: macros.kcal,
      });
      continue;
    }

    const native = rowNativeGrams(item);
    if (native == null) {
      return { ok: false, message: "Нужны граммы больше 0." };
    }
    const grams = Math.min(native, PLATE_GRAMS_MAX);
    next.push({ ...item, grams });
  }

  return { ok: true, items: next };
}
