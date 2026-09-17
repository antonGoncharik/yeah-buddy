import {
  cloneItemsToMeal,
  copyMealsFrom,
  isTempId,
  mealItemFromFood,
  mealItemFromLump,
  placeholderDay,
  replaceItemsFromTemplate,
  withAddedItem,
  withBodyWeight,
  withDayType,
  withRemovedItem,
  withUpdatedItemGrams,
} from "@/lib/day/optimistic";
import type { Food, MealTemplateDetail } from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

const food: Food = {
  id: "oats",
  user_id: "u",
  name: "Овсянка",
  brand: null,
  state: "dry",
  protein_per_100: 10,
  fat_per_100: 6,
  carbs_per_100: 60,
  kcal_per_100: 334,
  default_portion_g: 50,
  default_portion_label: null,
  yield_from_g: null,
  yield_to_g: null,
  is_favorite: false,
  notes: null,
  created_at: "2026-09-09T08:00:00.000Z",
  updated_at: "2026-09-09T08:00:00.000Z",
};

const day = placeholderDay("2026-09-09", "training", {
  protein: 140,
  fat: 70,
  carbs: 250,
  kcal: 2190,
});

assert(day.is_training_day, "placeholder training");
assertEqual(day.target_protein, 140, "placeholder protein");
assert(day.meals.length === 6, "all meal slots");
assert(
  day.meals.every((meal) => isTempId(meal.id)),
  "temp meal ids",
);

const breakfast = day.meals.find((meal) => meal.meal_type === "breakfast");
assert(breakfast != null, "breakfast exists");
if (!breakfast) {
  throw new Error("breakfast missing");
}

const added = mealItemFromFood({
  mealId: breakfast.id,
  food,
  grams: 50,
});
assert(isTempId(added.id), "temp item id");
assertEqual(added.protein, 5, "oats protein");
assertEqual(added.carbs, 30, "oats carbs");

const withItem = withAddedItem(day, breakfast.id, added);
assertEqual(withItem.meals[0]?.items.length, 1, "item added");

const bumped = withUpdatedItemGrams(withItem, added.id, 100);
assertEqual(bumped.meals[0]?.items[0]?.grams, 100, "grams updated");
assertEqual(bumped.meals[0]?.items[0]?.protein, 10, "protein scaled");

const removed = withRemovedItem(withItem, added.id);
assertEqual(removed.meals[0]?.items.length, 0, "item removed");

const rest = withDayType(day, "rest", {
  protein: 120,
  fat: 70,
  carbs: 200,
  kcal: 1910,
});
assertEqual(rest.is_training_day, false, "flipped to rest");
assertEqual(rest.target_carbs, 200, "rest carbs");

const weighed = withBodyWeight(day, 81.4);
assertEqual(weighed.body_weight, 81.4, "body weight");

const lump = mealItemFromLump(breakfast.id, {
  name: "Шаурма",
  protein: 30,
  fat: 20,
  carbs: 40,
});
assertEqual(lump.food_id, null, "lump has no food");
assertEqual(lump.kcal, 460, "lump kcal");

const source = withAddedItem(day, breakfast.id, added);
const empty = placeholderDay("2026-09-10", "training");
const copied = copyMealsFrom(empty, source, "breakfast");
const copiedBreakfast = copied.meals.find(
  (meal) => meal.meal_type === "breakfast",
);
assertEqual(copiedBreakfast?.items.length, 1, "copied breakfast");
assert(copiedBreakfast?.items[0]?.id !== added.id, "copied item gets a new id");
assertEqual(
  cloneItemsToMeal([added], "meal-x")[0]?.meal_id,
  "meal-x",
  "clone meal id",
);

const template: MealTemplateDetail = {
  id: "tpl",
  user_id: "u",
  name: "Тренировка",
  day_type: "training",
  is_active: true,
  created_at: "2026-09-09T08:00:00.000Z",
  updated_at: "2026-09-09T08:00:00.000Z",
  items: [
    {
      id: "ti-1",
      user_id: "u",
      template_id: "tpl",
      meal_type: "breakfast",
      food_id: food.id,
      grams: 80,
      sort_order: 10,
      created_at: "2026-09-09T08:00:00.000Z",
      food,
      protein: 8,
      fat: 4.8,
      carbs: 48,
      kcal: 267.2,
    },
  ],
};

const filled = replaceItemsFromTemplate(day, template);
assertEqual(
  filled.meals.find((meal) => meal.meal_type === "breakfast")?.items[0]?.grams,
  80,
  "template grams",
);

console.log("day optimistic ok");
