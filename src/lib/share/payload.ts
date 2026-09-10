import { z } from "zod";

import { FOOD_STATES } from "@/lib/foods";
import { PACK_EMPTY_MEALS, PACK_EMPTY_WORKOUTS } from "@/lib/messages";
import {
  calcKcalFromMacros,
  calcMacrosFromPer100,
  formatKcal,
  isMealVisible,
  roundMacros,
  sumMealItems,
} from "@/lib/nutrition";
import type {
  MealTemplateDetail,
  UserSettings,
  WorkoutFormulas,
  WorkoutSettings,
  WorkoutTemplateDetail,
} from "@/lib/types";
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

export class PackEmptyError extends Error {}

export function foodMatchKey(input: {
  name: string;
  state: string;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
}): string {
  return [
    input.name.trim().toLowerCase(),
    input.state,
    round2(input.protein_per_100),
    round2(input.fat_per_100),
    round2(input.carbs_per_100),
  ].join("|");
}

export function buildMealsPayload(
  settings: UserSettings,
  templates: MealTemplateDetail[],
): MealsPackPayload {
  const rest = templates.find((row) => row.day_type === "rest");
  const training = templates.find((row) => row.day_type === "training");
  if (!rest || !training) {
    throw new PackEmptyError(PACK_EMPTY_MEALS);
  }

  const foodsByKey = new Map<string, PackFood>();
  const restItems = snapshotMealItems(rest, foodsByKey);
  const trainingItems = snapshotMealItems(training, foodsByKey);
  if (restItems.length === 0 && trainingItems.length === 0) {
    throw new PackEmptyError(PACK_EMPTY_MEALS);
  }

  return mealsPackPayloadSchema.parse({
    v: 1,
    goals: {
      rest_protein: settings.rest_protein,
      rest_fat: settings.rest_fat,
      rest_carbs: settings.rest_carbs,
      training_protein: settings.training_protein,
      training_fat: settings.training_fat,
      training_carbs: settings.training_carbs,
    },
    foods: [...foodsByKey.values()],
    templates: [
      { day_type: "rest", items: restItems },
      { day_type: "training", items: trainingItems },
    ],
  });
}

export function buildWorkoutsPayload(
  settings: WorkoutSettings,
  templates: WorkoutTemplateDetail[],
): WorkoutsPackPayload {
  const active = templates.filter(
    (template) => template.is_active && template.exercises.length > 0,
  );
  if (active.length === 0) {
    throw new PackEmptyError(PACK_EMPTY_WORKOUTS);
  }

  const exercisesByName = new Map<string, PackExercise>();
  const days = active.map((template) => {
    const names: string[] = [];
    for (const exercise of template.exercises) {
      if (!exercisesByName.has(exercise.name)) {
        exercisesByName.set(exercise.name, {
          name: exercise.name,
          short_name: exercise.short_name,
          category: exercise.category,
          workout_type: exercise.workout_type,
          unit: exercise.unit,
          weight_step: exercise.weight_step,
          formula_preset: exercise.formula_preset,
        });
      }
      names.push(exercise.name);
    }
    return {
      name: template.name,
      kind: template.kind,
      exercises: names,
    };
  });

  return workoutsPackPayloadSchema.parse({
    v: 1,
    exercises: [...exercisesByName.values()],
    templates: days,
    formulas: settings.formulas,
    max_increase_percent: settings.max_increase_percent,
  });
}

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

export function mealsPackHint(payload: MealsPackPayload): string {
  const rest = payload.templates.find((row) => row.day_type === "rest");
  const training = payload.templates.find((row) => row.day_type === "training");
  const restKcal = rest ? dayKcal(rest.items) : 0;
  const trainingKcal = training ? dayKcal(training.items) : 0;
  return `Отдых ${formatKcal(restKcal)} · зал ${formatKcal(trainingKcal)} ккал`;
}

export function workoutsPackHint(payload: WorkoutsPackPayload): string {
  const names = payload.templates.map((day) => day.name);
  if (names.length <= 3) {
    return names.join(" · ");
  }

  return `${names.slice(0, 2).join(" · ")} и ещё ${names.length - 2}`;
}

export function defaultMealsTitle(payload: MealsPackPayload): string {
  const rest = payload.templates.find((row) => row.day_type === "rest");
  const training = payload.templates.find((row) => row.day_type === "training");
  const restKcal = rest ? dayKcal(rest.items) : 0;
  const trainingKcal = training ? dayKcal(training.items) : 0;
  return `Еда · ${formatKcal(restKcal)} / ${formatKcal(trainingKcal)} ккал`;
}

export function defaultWorkoutsTitle(payload: WorkoutsPackPayload): string {
  return payload.templates.map((day) => day.name).join(" / ");
}

export function mealDayTotals(items: PackMealItem[]): {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
} {
  return roundMacros(
    sumMealItems(
      items.map((item) =>
        calcMacrosFromPer100(
          {
            protein: item.protein_per_100,
            fat: item.fat_per_100,
            carbs: item.carbs_per_100,
            kcal: calcKcalFromMacros(
              item.protein_per_100,
              item.fat_per_100,
              item.carbs_per_100,
            ),
          },
          item.grams,
        ),
      ),
    ),
  );
}

export function formulaHint(
  formulas: Pick<WorkoutFormulas, "dynamic">,
): string {
  const work = formulas.dynamic.base.work;
  if (work.length === 0) {
    return "своя схема";
  }

  const first = work[0];
  const same = work.every(
    (set) => set.percent === first?.percent && set.reps === first.reps,
  );
  if (same && first?.reps != null) {
    return `${work.length}×${first.reps}`;
  }

  return "своя схема";
}

function snapshotMealItems(
  template: MealTemplateDetail,
  foodsByKey: Map<string, PackFood>,
): PackMealItem[] {
  const items: PackMealItem[] = [];
  for (const item of template.items) {
    if (!isMealVisible(item.meal_type, template.day_type === "training")) {
      continue;
    }

    const food: PackFood = {
      name: item.food.name,
      brand: item.food.brand,
      state: item.food.state,
      protein_per_100: item.food.protein_per_100,
      fat_per_100: item.food.fat_per_100,
      carbs_per_100: item.food.carbs_per_100,
      kcal_per_100: item.food.kcal_per_100,
      default_portion_g: item.food.default_portion_g,
      default_portion_label: item.food.default_portion_label,
      is_favorite: item.food.is_favorite,
    };
    const key = foodMatchKey(food);
    if (!foodsByKey.has(key)) {
      foodsByKey.set(key, food);
    }

    items.push({
      meal_type: item.meal_type,
      food_name: food.name,
      food_state: food.state,
      protein_per_100: food.protein_per_100,
      fat_per_100: food.fat_per_100,
      carbs_per_100: food.carbs_per_100,
      grams: item.grams,
    });
  }

  return items;
}

function dayKcal(items: PackMealItem[]): number {
  return mealDayTotals(items).kcal;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isSharePackKind(value: unknown): value is SharePackKind {
  return value === "meals" || value === "workouts";
}
