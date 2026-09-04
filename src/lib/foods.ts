import { z } from "zod";

import { calcKcalFromMacros } from "@/lib/nutrition";
import type { Food, FoodState } from "@/lib/types";

export const FOOD_STATES = ["raw", "dry", "cooked", "as_is", "liquid"] as const;

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  });

export const foodInputSchema = z
  .object({
    name: z.string().trim().min(1, "Название обязательно."),
    brand: optionalText,
    state: z.enum(FOOD_STATES).optional(),
    protein_per_100: z.number().finite().min(0),
    fat_per_100: z.number().finite().min(0),
    carbs_per_100: z.number().finite().min(0),
    kcal_per_100: z.number().finite().min(0).nullable().optional(),
    default_portion_g: z.number().finite().positive().nullable().optional(),
    default_portion_label: optionalText,
    notes: optionalText,
    is_favorite: z.boolean().optional(),
  })
  .transform((value) => {
    const kcal =
      value.kcal_per_100 == null
        ? calcKcalFromMacros(
            value.protein_per_100,
            value.fat_per_100,
            value.carbs_per_100,
          )
        : value.kcal_per_100;

    return {
      name: value.name,
      brand: value.brand ?? null,
      ...(value.state != null ? { state: value.state } : {}),
      protein_per_100: value.protein_per_100,
      fat_per_100: value.fat_per_100,
      carbs_per_100: value.carbs_per_100,
      kcal_per_100: kcal,
      default_portion_g: value.default_portion_g ?? null,
      default_portion_label: value.default_portion_label ?? null,
      notes: value.notes ?? null,
      is_favorite: value.is_favorite ?? false,
    };
  });

export type FoodInput = z.infer<typeof foodInputSchema>;

export function mapFood(row: Record<string, unknown>): Food {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    brand: toNullableString(row.brand),
    state: toFoodState(row.state),
    protein_per_100: toNumber(row.protein_per_100),
    fat_per_100: toNumber(row.fat_per_100),
    carbs_per_100: toNumber(row.carbs_per_100),
    kcal_per_100: toNumber(row.kcal_per_100),
    default_portion_g: toNullableNumber(row.default_portion_g),
    default_portion_label: toNullableString(row.default_portion_label),
    is_favorite: Boolean(row.is_favorite),
    notes: toNullableString(row.notes),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function toFoodState(value: unknown): FoodState {
  if (
    value === "raw" ||
    value === "dry" ||
    value === "cooked" ||
    value === "as_is" ||
    value === "liquid"
  ) {
    return value;
  }

  return "as_is";
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}
