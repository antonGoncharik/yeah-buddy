import { LUMP_PORTION_G, macrosFromLump } from "@/lib/day/lump";
import type { DayWithMeals } from "@/lib/day/map";
import {
  calcMacrosFromPer100,
  defaultMacroGoals,
  getMealOrder,
  MEAL_DISPLAY_ORDER,
  roundMacros,
} from "@/lib/nutrition";
import type {
  DayType,
  Food,
  MealItem,
  MealTemplateDetail,
  MealType,
} from "@/lib/types";

const TEMP_PREFIX = "temp:";

export function tempId(kind: string): string {
  return `${TEMP_PREFIX}${kind}:${Math.random().toString(36).slice(2, 10)}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_PREFIX);
}

export function mealItemFromFood({
  mealId,
  food,
  grams,
}: {
  mealId: string;
  food: Pick<
    Food,
    | "id"
    | "name"
    | "protein_per_100"
    | "fat_per_100"
    | "carbs_per_100"
    | "kcal_per_100"
  >;
  grams: number;
}): MealItem {
  return mealItemFromMacros({
    mealId,
    foodId: food.id,
    name: food.name,
    grams,
    per100: {
      protein: food.protein_per_100,
      fat: food.fat_per_100,
      carbs: food.carbs_per_100,
      kcal: food.kcal_per_100,
    },
  });
}

export function mealItemFromLump(
  mealId: string,
  input: { name: string; protein: number; fat: number; carbs: number },
): MealItem {
  const macros = macrosFromLump(input);
  return mealItemFromMacros({
    mealId,
    foodId: null,
    name: input.name,
    grams: LUMP_PORTION_G,
    per100: macros,
  });
}

export function mealItemFromMacros({
  mealId,
  foodId,
  name,
  grams,
  per100,
}: {
  mealId: string;
  foodId: string | null;
  name: string;
  grams: number;
  per100: { protein: number; fat: number; carbs: number; kcal: number };
}): MealItem {
  const macros = roundMacros(calcMacrosFromPer100(per100, grams));
  const now = new Date().toISOString();
  return {
    id: tempId("item"),
    user_id: "",
    meal_id: mealId,
    food_id: foodId,
    name_snapshot: name,
    grams,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
    per_100_snapshot: per100,
    created_at: now,
    updated_at: now,
  };
}

export function withDayType(
  day: DayWithMeals,
  dayType: DayType,
  targets: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
  },
): DayWithMeals {
  return {
    ...day,
    is_training_day: dayType === "training",
    target_protein: targets.protein,
    target_fat: targets.fat,
    target_carbs: targets.carbs,
    target_kcal: targets.kcal,
  };
}

export function withBodyWeight(
  day: DayWithMeals,
  bodyWeight: number | null,
): DayWithMeals {
  return { ...day, body_weight: bodyWeight };
}

export function withRemovedItem(
  day: DayWithMeals,
  itemId: string,
): DayWithMeals {
  return {
    ...day,
    meals: day.meals.map((meal) => ({
      ...meal,
      items: meal.items.filter((item) => item.id !== itemId),
    })),
  };
}

export function withAddedItem(
  day: DayWithMeals,
  mealId: string,
  item: MealItem,
): DayWithMeals {
  return {
    ...day,
    meals: day.meals.map((meal) =>
      meal.id === mealId ? { ...meal, items: [...meal.items, item] } : meal,
    ),
  };
}

export function withAddedItems(
  day: DayWithMeals,
  mealId: string,
  items: MealItem[],
): DayWithMeals {
  if (items.length === 0) {
    return day;
  }
  return {
    ...day,
    meals: day.meals.map((meal) =>
      meal.id === mealId ? { ...meal, items: [...meal.items, ...items] } : meal,
    ),
  };
}

export function withReplacedItem(
  day: DayWithMeals,
  itemId: string,
  next: MealItem,
): DayWithMeals {
  return {
    ...day,
    meals: day.meals.map((meal) => ({
      ...meal,
      items: meal.items.map((item) => (item.id === itemId ? next : item)),
    })),
  };
}

export function withReplacedItems(
  day: DayWithMeals,
  replacements: Map<string, MealItem>,
): DayWithMeals {
  if (replacements.size === 0) {
    return day;
  }
  return {
    ...day,
    meals: day.meals.map((meal) => ({
      ...meal,
      items: meal.items.map((item) => replacements.get(item.id) ?? item),
    })),
  };
}

export function withUpdatedItemGrams(
  day: DayWithMeals,
  itemId: string,
  grams: number,
): DayWithMeals {
  return {
    ...day,
    meals: day.meals.map((meal) => ({
      ...meal,
      items: meal.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }
        const macros = roundMacros(
          calcMacrosFromPer100(item.per_100_snapshot, grams),
        );
        return {
          ...item,
          grams,
          protein: macros.protein,
          fat: macros.fat,
          carbs: macros.carbs,
          kcal: macros.kcal,
        };
      }),
    })),
  };
}

export function withUpdatedLump(
  day: DayWithMeals,
  itemId: string,
  input: { name: string; protein: number; fat: number; carbs: number },
): DayWithMeals {
  const macros = macrosFromLump(input);
  return {
    ...day,
    meals: day.meals.map((meal) => ({
      ...meal,
      items: meal.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              name_snapshot: input.name,
              grams: LUMP_PORTION_G,
              protein: macros.protein,
              fat: macros.fat,
              carbs: macros.carbs,
              kcal: macros.kcal,
              per_100_snapshot: macros,
            }
          : item,
      ),
    })),
  };
}

export function withMealItems(
  day: DayWithMeals,
  mealType: MealType,
  items: MealItem[],
): DayWithMeals {
  return {
    ...day,
    meals: day.meals.map((meal) =>
      meal.meal_type === mealType ? { ...meal, items } : meal,
    ),
  };
}

export function cloneItemsToMeal(
  items: MealItem[],
  mealId: string,
): MealItem[] {
  const now = new Date().toISOString();
  return items.map((item) => ({
    ...item,
    id: tempId("item"),
    meal_id: mealId,
    created_at: now,
    updated_at: now,
  }));
}

export function copyMealsFrom(
  target: DayWithMeals,
  source: DayWithMeals,
  mealType?: MealType,
): DayWithMeals {
  const sourceByType = new Map(
    source.meals.map((meal) => [meal.meal_type, meal] as const),
  );
  return {
    ...target,
    meals: target.meals.map((meal) => {
      if (mealType && meal.meal_type !== mealType) {
        return meal;
      }
      const from = sourceByType.get(meal.meal_type);
      if (!from) {
        return mealType ? meal : { ...meal, items: [] };
      }
      return { ...meal, items: cloneItemsToMeal(from.items, meal.id) };
    }),
  };
}

export function placeholderDay(
  date: string,
  dayType: DayType,
  targets = defaultMacroGoals(dayType),
): DayWithMeals {
  const now = new Date().toISOString();
  const dayId = tempId("day");
  return {
    id: dayId,
    user_id: "",
    date,
    is_training_day: dayType === "training",
    target_protein: targets.protein,
    target_fat: targets.fat,
    target_carbs: targets.carbs,
    target_kcal: targets.kcal,
    body_weight: null,
    notes: null,
    created_at: now,
    updated_at: now,
    meals: MEAL_DISPLAY_ORDER.map((mealType) => ({
      id: tempId("meal"),
      user_id: "",
      day_id: dayId,
      meal_type: mealType,
      sort_order: getMealOrder(mealType),
      created_at: now,
      items: [],
    })),
  };
}

export function dayFromTemplate(
  date: string,
  dayType: DayType,
  template: MealTemplateDetail | null,
  targets = defaultMacroGoals(dayType),
): DayWithMeals {
  const day = placeholderDay(date, dayType, targets);
  if (!template) {
    return day;
  }
  return replaceItemsFromTemplate(day, template);
}

export function replaceItemsFromTemplate(
  day: DayWithMeals,
  template: MealTemplateDetail,
): DayWithMeals {
  return {
    ...day,
    meals: day.meals.map((meal) => ({
      ...meal,
      items: template.items
        .filter((item) => item.meal_type === meal.meal_type && item.grams > 0)
        .map((item) =>
          mealItemFromFood({
            mealId: meal.id,
            food: item.food,
            grams: item.grams,
          }),
        ),
    })),
  };
}

export function bumpOrAddFood(
  day: DayWithMeals,
  mealType: MealType,
  food: Pick<
    Food,
    | "id"
    | "name"
    | "protein_per_100"
    | "fat_per_100"
    | "carbs_per_100"
    | "kcal_per_100"
  >,
  grams: number,
): DayWithMeals {
  const meal = day.meals.find((entry) => entry.meal_type === mealType);
  if (!meal) {
    return day;
  }
  const existing = meal.items.find((item) => item.food_id === food.id);
  if (existing) {
    return withUpdatedItemGrams(day, existing.id, existing.grams + grams);
  }
  return withAddedItem(
    day,
    meal.id,
    mealItemFromFood({ mealId: meal.id, food, grams }),
  );
}
