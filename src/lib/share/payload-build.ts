import { PACK_EMPTY_MEALS, PACK_EMPTY_WORKOUTS } from "@/lib/messages";
import { isMealVisible } from "@/lib/nutrition";
import {
  type MealsPackPayload,
  mealsPackPayloadSchema,
  type PackExercise,
  type PackFood,
  type PackMealItem,
  type WorkoutsPackPayload,
  workoutsPackPayloadSchema,
} from "@/lib/share/payload-schema";
import type {
  MealTemplateDetail,
  UserSettings,
  WorkoutSettings,
  WorkoutTemplateDetail,
} from "@/lib/types";

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
      yield_from_g: item.food.yield_from_g,
      yield_to_g: item.food.yield_to_g,
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
