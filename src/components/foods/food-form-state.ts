import { parseFoodState } from "@/lib/food/schema";
import { parseFood } from "@/lib/foods";
import { isRecord } from "@/lib/read";
import type { Food, FoodState } from "@/lib/types";

export interface FoodFormState {
  name: string;
  brand: string;
  state: FoodState;
  protein_per_100: string;
  fat_per_100: string;
  carbs_per_100: string;
  default_portion_g: string;
  default_portion_label: string;
  notes: string;
  is_favorite: boolean;
}

export function toFormState(food?: Food): FoodFormState {
  return {
    name: food?.name ?? "",
    brand: food?.brand ?? "",
    state: food?.state ?? "as_is",
    protein_per_100: food ? String(food.protein_per_100) : "",
    fat_per_100: food ? String(food.fat_per_100) : "",
    carbs_per_100: food ? String(food.carbs_per_100) : "",
    default_portion_g:
      food?.default_portion_g == null ? "" : String(food.default_portion_g),
    default_portion_label: food?.default_portion_label ?? "",
    notes: food?.notes ?? "",
    is_favorite: food?.is_favorite ?? false,
  };
}

export function parseNonneg(value: string): number | null {
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export function toPayload(
  form: FoodFormState,
  autoKcal: number | null,
): {
  name: string;
  brand: string | null;
  state: FoodState;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
  default_portion_g: number | null;
  default_portion_label: string | null;
  notes: string | null;
  is_favorite: boolean;
} | null {
  const protein = parseNonneg(form.protein_per_100);
  const fat = parseNonneg(form.fat_per_100);
  const carbs = parseNonneg(form.carbs_per_100);
  const portionRaw = form.default_portion_g.trim().replace(",", ".");

  if (!form.name.trim() || protein == null || fat == null || carbs == null) {
    return null;
  }

  if (autoKcal == null) {
    return null;
  }

  let default_portion_g: number | null = null;
  if (portionRaw !== "") {
    const portion = Number(portionRaw);
    if (!Number.isFinite(portion) || portion <= 0) {
      return null;
    }
    default_portion_g = portion;
  }

  return {
    name: form.name.trim(),
    brand: form.brand.trim() === "" ? null : form.brand.trim(),
    state: parseFoodState(form.state),
    protein_per_100: protein,
    fat_per_100: fat,
    carbs_per_100: carbs,
    kcal_per_100: autoKcal,
    default_portion_g,
    default_portion_label:
      form.default_portion_label.trim() === ""
        ? null
        : form.default_portion_label.trim(),
    notes: form.notes.trim() === "" ? null : form.notes.trim(),
    is_favorite: form.is_favorite,
  };
}

export function readFood(data: unknown): Food | null {
  if (!isRecord(data)) {
    return null;
  }

  return parseFood(data.food);
}
