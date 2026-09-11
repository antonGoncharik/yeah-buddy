import type { DayWithMeals } from "@/lib/day/map";
import { getDateForMeal } from "@/lib/day/meal-date";
import { buildMealItemRow } from "@/lib/day/meal-item-row";
import { recipeFromTemplate, remainingFills } from "@/lib/day/remaining";
import { getDayByDate } from "@/lib/day/store";
import { assertUserDayWritable } from "@/lib/day/writable";
import { getActiveMealTemplate } from "@/lib/meal-templates";
import { calcMacrosFromPer100, roundMacros } from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food, MealItem, MealType } from "@/lib/types";

export async function fillDayRemaining(
  userId: string,
  dayId: string,
): Promise<DayWithMeals> {
  const day = await loadDayById(userId, dayId);
  if (!day) {
    throw new Error("Day not found");
  }
  return applyRemainingFills(userId, day);
}

export async function fillMealRemaining(
  userId: string,
  mealId: string,
): Promise<DayWithMeals> {
  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }

  const day = await getDayByDate(userId, date);
  if (!day) {
    throw new Error("Meal not found");
  }

  const meal = day.meals.find((entry) => entry.id === mealId);
  if (!meal) {
    throw new Error("Meal not found");
  }

  return applyRemainingFills(userId, day, meal.meal_type);
}

async function applyRemainingFills(
  userId: string,
  day: DayWithMeals,
  mealType?: MealType,
): Promise<DayWithMeals> {
  await assertUserDayWritable(userId, day.date);

  const template = await getActiveMealTemplate(
    userId,
    day.is_training_day ? "training" : "rest",
  );
  const fills = remainingFills(
    recipeFromTemplate(template),
    day.meals,
    day.is_training_day,
  ).filter((fill) => (mealType ? fill.mealType === mealType : true));

  if (fills.length === 0) {
    return day;
  }

  const foodById = new Map<string, Food>();
  for (const item of template?.items ?? []) {
    foodById.set(item.food.id, item.food);
  }

  const mealByType = new Map(
    day.meals.map((meal) => [meal.meal_type, meal] as const),
  );
  const supabase = createSupabaseServerClient();
  const inserts = [];

  for (const fill of fills) {
    const meal = mealByType.get(fill.mealType);
    if (!meal) {
      continue;
    }

    const existing = matchingItem(meal.items, fill.foodId, fill.name);
    if (existing) {
      await bumpItemGrams(supabase, userId, existing, fill.grams);
      existing.grams += fill.grams;
      continue;
    }

    const food = foodById.get(fill.foodId);
    if (!food) {
      continue;
    }

    inserts.push(
      buildMealItemRow({
        userId,
        mealId: meal.id,
        foodId: food.id,
        name: food.name,
        grams: fill.grams,
        per100: {
          protein: food.protein_per_100,
          fat: food.fat_per_100,
          carbs: food.carbs_per_100,
          kcal: food.kcal_per_100,
        },
      }),
    );
  }

  if (inserts.length > 0) {
    const inserted = await supabase.from("meal_items").insert(inserts);
    if (inserted.error) {
      throw inserted.error;
    }
  }

  const next = await getDayByDate(userId, day.date);
  if (!next) {
    throw new Error("Day lookup failed");
  }
  return next;
}

async function loadDayById(
  userId: string,
  dayId: string,
): Promise<DayWithMeals | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("date")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return getDayByDate(userId, String(result.data.date).slice(0, 10));
}

function matchingItem(
  items: MealItem[],
  foodId: string,
  name: string,
): MealItem | undefined {
  const byId = items.find((item) => item.food_id === foodId);
  if (byId) {
    return byId;
  }

  const nameKey = name.trim().toLowerCase();
  return items.find(
    (item) =>
      !item.food_id && item.name_snapshot.trim().toLowerCase() === nameKey,
  );
}

async function bumpItemGrams(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  item: MealItem,
  grams: number,
): Promise<void> {
  const nextGrams = item.grams + grams;
  const macros = roundMacros(
    calcMacrosFromPer100(item.per_100_snapshot, nextGrams),
  );
  const updated = await supabase
    .from("meal_items")
    .update({
      grams: nextGrams,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      kcal: macros.kcal,
    })
    .eq("id", item.id)
    .eq("user_id", userId);

  if (updated.error) {
    throw updated.error;
  }
}
