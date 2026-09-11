import { z } from "zod";

import { FOOD_STATES } from "@/lib/foods";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_UNITS,
  EXERCISE_WORKOUT_TYPES,
  FORMULA_PRESETS,
} from "@/lib/workout/labels";
import { formulasSchema } from "@/lib/workout/map-settings";

export const SHARE_PACK_KINDS = ["meals", "workouts"] as const;

export type SharePackKind = (typeof SHARE_PACK_KINDS)[number];

const foodKeyPart = z.number().finite().min(0);

export const packFoodSchema = z.object({
  name: z.string().trim().min(1).max(80),
  brand: z.string().trim().max(80).nullable(),
  state: z.enum(FOOD_STATES),
  protein_per_100: foodKeyPart,
  fat_per_100: foodKeyPart,
  carbs_per_100: foodKeyPart,
  kcal_per_100: foodKeyPart,
  default_portion_g: z.number().finite().positive().nullable(),
  default_portion_label: z.string().trim().max(80).nullable(),
  is_favorite: z.boolean(),
});

export const packMealItemSchema = z.object({
  meal_type: z.enum([
    "breakfast",
    "lunch",
    "snack",
    "dinner",
    "pre_workout",
    "post_workout",
  ]),
  food_name: z.string().trim().min(1).max(80),
  food_state: z.enum(FOOD_STATES),
  protein_per_100: foodKeyPart,
  fat_per_100: foodKeyPart,
  carbs_per_100: foodKeyPart,
  grams: z.number().finite().positive(),
});

export const packMealDaySchema = z.object({
  day_type: z.enum(["rest", "training"]),
  items: z.array(packMealItemSchema).max(80),
});

const macroGoal = z.number().finite().min(0).max(1000);

export const mealsPackPayloadSchema = z.object({
  v: z.literal(1),
  goals: z.object({
    rest_protein: macroGoal,
    rest_fat: macroGoal,
    rest_carbs: macroGoal,
    training_protein: macroGoal,
    training_fat: macroGoal,
    training_carbs: macroGoal,
  }),
  foods: z.array(packFoodSchema).min(1).max(80),
  templates: z.array(packMealDaySchema).length(2),
});

export const packExerciseSchema = z.object({
  name: z.string().trim().min(1).max(80),
  short_name: z.string().trim().max(40).nullable(),
  category: z.enum(EXERCISE_CATEGORIES),
  workout_type: z.enum(EXERCISE_WORKOUT_TYPES),
  unit: z.enum(EXERCISE_UNITS),
  weight_step: z.number().finite().positive(),
  formula_preset: z.enum(FORMULA_PRESETS),
});

export const packWorkoutDaySchema = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["dynamic", "static"]),
  exercises: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
});

export const workoutsPackPayloadSchema = z.object({
  v: z.literal(1),
  exercises: z.array(packExerciseSchema).min(1).max(40),
  templates: z.array(packWorkoutDaySchema).min(1).max(14),
  formulas: formulasSchema,
  max_increase_percent: z.number().finite().min(0).max(50),
});

export type PackFood = z.infer<typeof packFoodSchema>;
export type PackMealItem = z.infer<typeof packMealItemSchema>;
export type MealsPackPayload = z.infer<typeof mealsPackPayloadSchema>;
export type PackExercise = z.infer<typeof packExerciseSchema>;
export type WorkoutsPackPayload = z.infer<typeof workoutsPackPayloadSchema>;
export type SharePackPayload = MealsPackPayload | WorkoutsPackPayload;

export function parseSharePayload(
  kind: SharePackKind,
  value: unknown,
): SharePackPayload | null {
  if (kind === "meals") {
    const parsed = mealsPackPayloadSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  }

  const parsed = workoutsPackPayloadSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function isSharePackKind(value: unknown): value is SharePackKind {
  return value === "meals" || value === "workouts";
}
