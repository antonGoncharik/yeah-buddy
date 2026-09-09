import {
  assertWritableDayDate,
  DayConflictError,
  isIsoDate,
  isPastDayDate,
  previousIsoDate,
  YesterdayMissingError,
} from "@/lib/day/dates";
import {
  type DayWithMeals,
  mapDayHistoryRow,
  mapDayWithMeals,
  mapMealItem,
} from "@/lib/day/map";
import { mapFood } from "@/lib/foods";
import { getActiveMealTemplate } from "@/lib/meal-templates";
import {
  calcKcalFromMacros,
  calcMacrosFromPer100,
  defaultMacroGoals,
  getMealOrder,
  isMealType,
  type Macros,
  MEAL_DISPLAY_ORDER,
  roundMacros,
} from "@/lib/nutrition";
import { toNumber } from "@/lib/read";
import { getUserSettings } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayHistoryRow, DayType, MealItem, MealType } from "@/lib/types";

export {
  assertWritableDayDate,
  calendarToday,
  DayConflictError,
  isIsoDate,
  isPastDayDate,
  nextIsoDate,
  nutritionHistoryHref,
  PastDayLockedError,
  previousIsoDate,
  todayHistoryDayHref,
  todayHomeHref,
  withDateQuery,
  YesterdayMissingError,
} from "@/lib/day/dates";
export { type DayWithMeals, mapDayWithMeals } from "@/lib/day/map";

export type FoodShare = {
  name: string;
  protein: number;
  kcal: number;
  grams: number;
};

export async function getDayByDate(
  userId: string,
  date: string,
): Promise<DayWithMeals | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
      *,
      meals (
        *,
        meal_items (*)
      )
    `,
    )
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapDayWithMeals(result.data as Record<string, unknown>);
}

export async function dateHasDay(
  userId: string,
  date: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("date", date);

  if (result.error) {
    throw result.error;
  }

  return (result.count ?? 0) > 0;
}

const DAY_HISTORY_SELECT = `
  date,
  is_training_day,
  target_protein,
  target_fat,
  target_carbs,
  target_kcal,
  meals (
    meal_items (
      protein,
      fat,
      carbs,
      kcal
    )
  )
`;

export async function listDayHistory(
  userId: string,
  options: { before?: string; limit: number },
): Promise<{ items: DayHistoryRow[]; next_before: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 50);
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("days")
    .select(DAY_HISTORY_SELECT)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit + 1);

  if (options.before && isIsoDate(options.before)) {
    query = query.lt("date", options.before);
  }

  const result = await query;
  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []).map((row) =>
    mapDayHistoryRow(row as Record<string, unknown>),
  );
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    next_before: hasMore ? (items.at(-1)?.date ?? null) : null,
  };
}

export async function listDaysInRange(
  userId: string,
  start: string,
  end: string,
): Promise<DayHistoryRow[]> {
  if (!isIsoDate(start) || !isIsoDate(end)) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(DAY_HISTORY_SELECT)
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) =>
    mapDayHistoryRow(row as Record<string, unknown>),
  );
}

export async function listFoodSharesInRange(
  userId: string,
  start: string,
  end: string,
): Promise<FoodShare[]> {
  if (!isIsoDate(start) || !isIsoDate(end)) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
      meals (
        meal_items (
          name_snapshot,
          grams,
          protein,
          kcal
        )
      )
    `,
    )
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  if (result.error) {
    throw result.error;
  }

  const totals = new Map<string, FoodShare>();
  for (const row of result.data ?? []) {
    const meals = (row as { meals?: unknown }).meals;
    if (!Array.isArray(meals)) {
      continue;
    }
    for (const meal of meals) {
      if (!meal || typeof meal !== "object" || !("meal_items" in meal)) {
        continue;
      }
      const items = (meal as { meal_items: unknown }).meal_items;
      if (!Array.isArray(items)) {
        continue;
      }
      for (const item of items) {
        if (!item || typeof item !== "object") {
          continue;
        }
        const record = item as Record<string, unknown>;
        const name = String(record.name_snapshot ?? "").trim();
        if (name === "") {
          continue;
        }
        const current = totals.get(name) ?? {
          name,
          protein: 0,
          kcal: 0,
          grams: 0,
        };
        current.protein += toNumber(record.protein);
        current.kcal += toNumber(record.kcal);
        current.grams += toNumber(record.grams);
        totals.set(name, current);
      }
    }
  }

  return [...totals.values()]
    .sort((left, right) => {
      if (right.protein !== left.protein) {
        return right.protein - left.protein;
      }
      return left.name.localeCompare(right.name, "ru");
    })
    .slice(0, 8)
    .map((item) => ({
      name: item.name,
      protein: round1(item.protein),
      kcal: Math.round(item.kcal),
      grams: Math.round(item.grams),
    }));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function createDayFromTemplate(
  userId: string,
  date: string,
  dayType: DayType,
): Promise<DayWithMeals> {
  assertWritableDayDate(date);
  const existing = await getDayByDate(userId, date);
  if (existing) {
    throw new DayConflictError();
  }

  const supabase = createSupabaseServerClient();
  const targets = await getTargets(userId, dayType);
  const created = await supabase
    .from("days")
    .insert({
      user_id: userId,
      date,
      is_training_day: dayType === "training",
      target_protein: targets.protein,
      target_fat: targets.fat,
      target_carbs: targets.carbs,
    })
    .select("*")
    .single();

  if (created.error) {
    if (created.error.code === "23505") {
      throw new DayConflictError();
    }
    throw created.error;
  }

  const dayId = String(created.data.id);
  const mealIds = await insertEmptyMeals(supabase, userId, dayId);
  const template = await getActiveMealTemplate(userId, dayType);

  if (template && template.items.length > 0) {
    const rows = [];
    for (const item of template.items) {
      const mealId = mealIds.get(item.meal_type);
      if (!mealId) {
        continue;
      }

      rows.push(
        buildMealItemRow({
          userId,
          mealId,
          foodId: item.food.id,
          name: item.food.name,
          grams: item.grams,
          per100: {
            protein: item.food.protein_per_100,
            fat: item.food.fat_per_100,
            carbs: item.food.carbs_per_100,
            kcal: item.food.kcal_per_100,
          },
        }),
      );
    }

    if (rows.length > 0) {
      const insertedItems = await supabase.from("meal_items").insert(rows);
      if (insertedItems.error) {
        throw insertedItems.error;
      }
    }
  }

  const day = await getDayByDate(userId, date);
  if (!day) {
    throw new Error("Day lookup failed");
  }

  return day;
}

export async function copyYesterday(
  userId: string,
  date: string,
  replace: boolean,
): Promise<DayWithMeals> {
  assertWritableDayDate(date);
  const yesterday = await getDayByDate(userId, previousIsoDate(date));
  if (!yesterday) {
    throw new YesterdayMissingError();
  }

  const existing = await getDayByDate(userId, date);
  if (existing && !replace) {
    throw new DayConflictError();
  }

  const supabase = createSupabaseServerClient();

  if (existing && replace) {
    const deleted = await supabase
      .from("days")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (deleted.error) {
      throw deleted.error;
    }
  }

  const created = await supabase
    .from("days")
    .insert({
      user_id: userId,
      date,
      is_training_day: yesterday.is_training_day,
      target_protein: yesterday.target_protein,
      target_fat: yesterday.target_fat,
      target_carbs: yesterday.target_carbs,
      notes: yesterday.notes,
    })
    .select("*")
    .single();

  if (created.error) {
    if (created.error.code === "23505") {
      throw new DayConflictError();
    }
    throw created.error;
  }

  const dayId = String(created.data.id);
  const mealIds = await insertEmptyMeals(supabase, userId, dayId);
  const rows = [];

  for (const meal of yesterday.meals) {
    const mealId = mealIds.get(meal.meal_type);
    if (!mealId) {
      continue;
    }

    for (const item of meal.items) {
      rows.push({
        user_id: userId,
        meal_id: mealId,
        food_id: item.food_id,
        name_snapshot: item.name_snapshot,
        grams: item.grams,
        protein: item.protein,
        fat: item.fat,
        carbs: item.carbs,
        kcal: item.kcal,
        per_100_snapshot: item.per_100_snapshot,
      });
    }
  }

  if (rows.length > 0) {
    const insertedItems = await supabase.from("meal_items").insert(rows);
    if (insertedItems.error) {
      throw insertedItems.error;
    }
  }

  const day = await getDayByDate(userId, date);
  if (!day) {
    throw new Error("Day lookup failed");
  }

  return day;
}

export async function setDayType(
  userId: string,
  dayId: string,
  dayType: DayType,
): Promise<DayWithMeals> {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("days")
    .select("date")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (!existing.data) {
    throw new Error("Day not found");
  }

  assertWritableDayDate(String(existing.data.date).slice(0, 10));

  const targets = await getTargets(userId, dayType);
  const updated = await supabase
    .from("days")
    .update({
      is_training_day: dayType === "training",
      target_protein: targets.protein,
      target_fat: targets.fat,
      target_carbs: targets.carbs,
    })
    .eq("id", dayId)
    .eq("user_id", userId)
    .select("date")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    throw new Error("Day not found");
  }

  const day = await getDayByDate(userId, String(updated.data.date));
  if (!day) {
    throw new Error("Day lookup failed");
  }

  return day;
}

export async function markDateAsTrainingIfExists(
  userId: string,
  date: string,
): Promise<void> {
  if (isPastDayDate(date)) {
    return;
  }

  const day = await getDayByDate(userId, date);
  if (!day || day.is_training_day) {
    return;
  }

  await setDayType(userId, day.id, "training");
}

export async function getDateForMeal(
  userId: string,
  mealId: string,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const meal = await supabase
    .from("meals")
    .select("day_id")
    .eq("id", mealId)
    .eq("user_id", userId)
    .maybeSingle();

  if (meal.error) {
    throw meal.error;
  }

  if (!meal.data) {
    return null;
  }

  const day = await supabase
    .from("days")
    .select("date")
    .eq("id", meal.data.day_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (day.error) {
    throw day.error;
  }

  if (!day.data) {
    return null;
  }

  return String(day.data.date).slice(0, 10);
}

export async function addMealItem(
  userId: string,
  mealId: string,
  foodId: string,
  grams: number,
): Promise<MealItem> {
  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new Error("Meal not found");
  }
  assertWritableDayDate(date);

  const supabase = createSupabaseServerClient();
  const meal = await supabase
    .from("meals")
    .select("id")
    .eq("id", mealId)
    .eq("user_id", userId)
    .maybeSingle();

  if (meal.error) {
    throw meal.error;
  }

  if (!meal.data) {
    throw new Error("Meal not found");
  }

  const foodRow = await supabase
    .from("foods")
    .select("*")
    .eq("id", foodId)
    .eq("user_id", userId)
    .maybeSingle();

  if (foodRow.error) {
    throw foodRow.error;
  }

  if (!foodRow.data) {
    throw new Error("Food not found");
  }

  const food = mapFood(foodRow.data as Record<string, unknown>);
  const inserted = await supabase
    .from("meal_items")
    .insert(
      buildMealItemRow({
        userId,
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
      }),
    )
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Meal item insert failed");
  }

  return mapMealItem(inserted.data as Record<string, unknown>);
}

export async function getMealItem(
  userId: string,
  itemId: string,
): Promise<MealItem | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("meal_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapMealItem(result.data as Record<string, unknown>);
}

export async function updateMealItemGrams(
  userId: string,
  itemId: string,
  grams: number,
): Promise<MealItem> {
  const item = await getMealItem(userId, itemId);
  if (!item) {
    throw new Error("Meal item not found");
  }

  const date = await getDateForMeal(userId, item.meal_id);
  if (!date) {
    throw new Error("Meal item not found");
  }
  assertWritableDayDate(date);

  const macros = roundMacros(
    calcMacrosFromPer100(item.per_100_snapshot, grams),
  );
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("meal_items")
    .update({
      grams,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      kcal: macros.kcal,
    })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    throw new Error("Meal item not found");
  }

  return mapMealItem(updated.data as Record<string, unknown>);
}

export async function deleteMealItem(
  userId: string,
  itemId: string,
): Promise<boolean> {
  const item = await getMealItem(userId, itemId);
  if (!item) {
    return false;
  }

  const date = await getDateForMeal(userId, item.meal_id);
  if (!date) {
    return false;
  }
  assertWritableDayDate(date);

  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("meal_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (deleted.error) {
    throw deleted.error;
  }

  return Boolean(deleted.data);
}

async function insertEmptyMeals(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  dayId: string,
): Promise<Map<MealType, string>> {
  const inserted = await supabase
    .from("meals")
    .insert(
      MEAL_DISPLAY_ORDER.map((mealType) => ({
        user_id: userId,
        day_id: dayId,
        meal_type: mealType,
        sort_order: getMealOrder(mealType),
      })),
    )
    .select("id, meal_type");

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Meal insert failed");
  }

  const mealIds = new Map<MealType, string>();
  for (const row of inserted.data) {
    if (isMealType(row.meal_type) && typeof row.id === "string") {
      mealIds.set(row.meal_type, row.id);
    }
  }

  return mealIds;
}

async function getTargets(userId: string, dayType: DayType): Promise<Macros> {
  const settings = await getUserSettings(userId);
  const fallback = defaultMacroGoals(dayType);
  const protein =
    (dayType === "training"
      ? settings?.training_protein
      : settings?.rest_protein) ?? fallback.protein;
  const fat =
    (dayType === "training" ? settings?.training_fat : settings?.rest_fat) ??
    fallback.fat;
  const carbs =
    (dayType === "training"
      ? settings?.training_carbs
      : settings?.rest_carbs) ?? fallback.carbs;

  return {
    protein,
    fat,
    carbs,
    kcal: calcKcalFromMacros(protein, fat, carbs),
  };
}

function buildMealItemRow({
  userId,
  mealId,
  foodId,
  name,
  grams,
  per100,
}: {
  userId: string;
  mealId: string;
  foodId: string;
  name: string;
  grams: number;
  per100: Macros;
}) {
  const macros = roundMacros(calcMacrosFromPer100(per100, grams));

  return {
    user_id: userId,
    meal_id: mealId,
    food_id: foodId,
    name_snapshot: name,
    grams,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
    per_100_snapshot: per100,
  };
}
