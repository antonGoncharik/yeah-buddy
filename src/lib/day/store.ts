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
} from "@/lib/day/map";
import { buildMealItemRow } from "@/lib/day/meal-items";
import { getActiveMealTemplate } from "@/lib/meal-templates";
import {
  calcKcalFromMacros,
  defaultMacroGoals,
  getMealOrder,
  isMealType,
  type Macros,
  MEAL_DISPLAY_ORDER,
} from "@/lib/nutrition";
import { getUserSettings } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayHistoryRow, DayType, MealType } from "@/lib/types";

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
