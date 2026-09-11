import { z } from "zod";

export const NAMED_MEAL_LIMIT = 20;
export const NAMED_MEAL_NAME_MAX = 40;

export const namedMealSaveSchema = z.object({
  name: z.string().trim().min(1).max(NAMED_MEAL_NAME_MAX),
  mealId: z.string().trim().min(1),
});

export type NamedMealSaveInput = z.infer<typeof namedMealSaveSchema>;

export const namedMealApplySchema = z.object({
  namedMealId: z.string().trim().min(1),
  replace: z.boolean().optional(),
});

export type NamedMealApplyInput = z.infer<typeof namedMealApplySchema>;
