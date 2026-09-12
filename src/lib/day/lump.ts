import { z } from "zod";

import { calcKcalFromMacros, type Macros, roundMacros } from "@/lib/nutrition";

export const LUMP_PORTION_G = 100;
export const LUMP_NAME_MAX = 80;
export const LUMP_MACRO_MAX = 500;

export const lumpMealItemSchema = z
  .object({
    name: z.string().trim().min(1).max(LUMP_NAME_MAX),
    protein: z.number().finite().min(0).max(LUMP_MACRO_MAX),
    fat: z.number().finite().min(0).max(LUMP_MACRO_MAX),
    carbs: z.number().finite().min(0).max(LUMP_MACRO_MAX),
  })
  .refine((value) => value.protein + value.fat + value.carbs > 0);

export type LumpMealItemInput = z.infer<typeof lumpMealItemSchema>;

export function isLumpMealItem(item: { food_id: string | null }): boolean {
  return item.food_id == null;
}

export function macrosFromLump(
  input: Pick<LumpMealItemInput, "protein" | "fat" | "carbs">,
): Macros {
  return roundMacros({
    protein: input.protein,
    fat: input.fat,
    carbs: input.carbs,
    kcal: calcKcalFromMacros(input.protein, input.fat, input.carbs),
  });
}

export function lumpHref(base: string, name: string): string {
  const trimmed = name.trim();
  if (trimmed === "") {
    return base;
  }

  const join = base.includes("?") ? "&" : "?";
  return `${base}${join}name=${encodeURIComponent(trimmed)}`;
}
