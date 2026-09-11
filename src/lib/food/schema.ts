import { z } from "zod";

import { calcKcalFromMacros } from "@/lib/nutrition";

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
    return {
      name: value.name,
      brand: value.brand ?? null,
      ...(value.state != null ? { state: value.state } : {}),
      protein_per_100: value.protein_per_100,
      fat_per_100: value.fat_per_100,
      carbs_per_100: value.carbs_per_100,
      kcal_per_100: calcKcalFromMacros(
        value.protein_per_100,
        value.fat_per_100,
        value.carbs_per_100,
      ),
      default_portion_g: value.default_portion_g ?? null,
      default_portion_label: value.default_portion_label ?? null,
      notes: value.notes ?? null,
      is_favorite: value.is_favorite ?? false,
    };
  });

export type FoodInput = z.infer<typeof foodInputSchema>;

export const foodFavoriteSchema = z.object({
  is_favorite: z.boolean(),
});

export type FoodListFilter = "all" | "favorites" | "recent";

export function parseFoodListFilter(value: string | null): FoodListFilter {
  if (value === "favorites" || value === "recent") {
    return value;
  }

  return "all";
}
