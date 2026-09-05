import { mapFood } from "@/lib/foods";
import { DAY_EXISTS_REPLACE, YESTERDAY_MISSING } from "@/lib/messages";
import {
  calcKcalFromMacros,
  calcMacrosFromPer100,
  getMealOrder,
  type Macros,
  MEAL_DISPLAY_ORDER,
} from "@/lib/nutrition";
import { getUserSettings } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Day,
  DayHistoryRow,
  DayType,
  Meal,
  MealItem,
  MealType,
} from "@/lib/types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class DayConflictError extends Error {
  readonly code = "DAY_EXISTS";

  constructor() {
    super(DAY_EXISTS_REPLACE);
  }
}

export class YesterdayMissingError extends Error {
  constructor() {
    super(YESTERDAY_MISSING);
  }
}

export type DayWithMeals = Day & {
  meals: Array<Meal & { items: MealItem[] }>;
};

export function isIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function previousIsoDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  return previous.toISOString().slice(0, 10);
}

export function nextIsoDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}

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

export async function listDayHistory(
  userId: string,
  options: { before?: string; limit: number },
): Promise<{ items: DayHistoryRow[]; next_before: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 50);
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("days")
    .select(
      `
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
    `,
    )
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

export async function createDayFromTemplate(
  userId: string,
  date: string,
  dayType: DayType,
): Promise<DayWithMeals> {
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
  const templateItems = await loadTemplateItems(supabase, userId, dayType);

  if (templateItems.length > 0) {
    const foodIds = [...new Set(templateItems.map((item) => item.food_id))];
    const foods = await supabase
      .from("foods")
      .select("*")
      .eq("user_id", userId)
      .in("id", foodIds);

    if (foods.error) {
      throw foods.error;
    }

    const foodById = new Map(
      (foods.data ?? []).map((row) => {
        const food = mapFood(row as Record<string, unknown>);
        return [food.id, food];
      }),
    );

    const rows = [];
    for (const item of templateItems) {
      const mealId = mealIds.get(item.meal_type);
      const food = foodById.get(item.food_id);
      if (!mealId || !food) {
        continue;
      }

      rows.push(
        buildMealItemRow({
          userId,
          mealId,
          foodId: food.id,
          name: food.name,
          grams: item.grams,
          per100: {
            protein: food.protein_per_100,
            fat: food.fat_per_100,
            carbs: food.carbs_per_100,
            kcal: food.kcal_per_100,
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
  const day = await getDayByDate(userId, date);
  if (!day || day.is_training_day) {
    return;
  }

  await setDayType(userId, day.id, "training");
}

export async function addMealItem(
  userId: string,
  mealId: string,
  foodId: string,
  grams: number,
): Promise<MealItem> {
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

async function loadTemplateItems(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  dayType: DayType,
): Promise<Array<{ meal_type: MealType; food_id: string; grams: number }>> {
  const template = await supabase
    .from("meal_templates")
    .select("id")
    .eq("user_id", userId)
    .eq("day_type", dayType)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (template.error) {
    throw template.error;
  }

  if (!template.data) {
    return [];
  }

  const items = await supabase
    .from("meal_template_items")
    .select("meal_type, food_id, grams, sort_order")
    .eq("user_id", userId)
    .eq("template_id", template.data.id)
    .order("sort_order", { ascending: true });

  if (items.error) {
    throw items.error;
  }

  return (items.data ?? []).flatMap((row) => {
    if (!isMealType(row.meal_type) || typeof row.food_id !== "string") {
      return [];
    }

    return [
      {
        meal_type: row.meal_type,
        food_id: row.food_id,
        grams: toNumber(row.grams),
      },
    ];
  });
}

async function getTargets(userId: string, dayType: DayType): Promise<Macros> {
  const settings = await getUserSettings(userId);
  const protein =
    dayType === "training"
      ? (settings?.training_protein ?? 200)
      : (settings?.rest_protein ?? 200);
  const fat =
    dayType === "training"
      ? (settings?.training_fat ?? 70)
      : (settings?.rest_fat ?? 70);
  const carbs =
    dayType === "training"
      ? (settings?.training_carbs ?? 200)
      : (settings?.rest_carbs ?? 130);

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

function mapDayHistoryRow(row: Record<string, unknown>): DayHistoryRow {
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let kcal = 0;
  if (Array.isArray(row.meals)) {
    for (const meal of row.meals) {
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
        const macros = item as Record<string, unknown>;
        protein += toNumber(macros.protein);
        fat += toNumber(macros.fat);
        carbs += toNumber(macros.carbs);
        kcal += toNumber(macros.kcal);
      }
    }
  }

  return {
    date: String(row.date).slice(0, 10),
    is_training_day: Boolean(row.is_training_day),
    target_protein: toNumber(row.target_protein),
    target_fat: toNumber(row.target_fat),
    target_carbs: toNumber(row.target_carbs),
    target_kcal: toNumber(row.target_kcal),
    fact_protein: protein,
    fact_fat: fat,
    fact_carbs: carbs,
    fact_kcal: kcal,
  };
}

function mapDayWithMeals(row: Record<string, unknown>): DayWithMeals {
  const meals = Array.isArray(row.meals)
    ? row.meals
        .map((meal) => mapMeal(meal as Record<string, unknown>))
        .sort((left, right) => left.sort_order - right.sort_order)
    : [];

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    date: String(row.date),
    is_training_day: Boolean(row.is_training_day),
    target_protein: toNumber(row.target_protein),
    target_fat: toNumber(row.target_fat),
    target_carbs: toNumber(row.target_carbs),
    target_kcal: toNumber(row.target_kcal),
    notes: toNullableString(row.notes),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    meals,
  };
}

function mapMeal(row: Record<string, unknown>): Meal & { items: MealItem[] } {
  const items = Array.isArray(row.meal_items)
    ? row.meal_items
        .map((item) => mapMealItem(item as Record<string, unknown>))
        .sort((left, right) => left.created_at.localeCompare(right.created_at))
    : [];

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    day_id: String(row.day_id),
    meal_type: isMealType(row.meal_type) ? row.meal_type : "snack",
    sort_order: toNumber(row.sort_order),
    created_at: String(row.created_at),
    items,
  };
}

function mapMealItem(row: Record<string, unknown>): MealItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    meal_id: String(row.meal_id),
    food_id: toNullableString(row.food_id),
    name_snapshot: String(row.name_snapshot),
    grams: toNumber(row.grams),
    protein: toNumber(row.protein),
    fat: toNumber(row.fat),
    carbs: toNumber(row.carbs),
    kcal: toNumber(row.kcal),
    per_100_snapshot: mapPer100(row.per_100_snapshot),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapPer100(value: unknown): Macros {
  if (!value || typeof value !== "object") {
    return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }

  const snapshot = value as Record<string, unknown>;
  return {
    protein: toNumber(snapshot.protein),
    fat: toNumber(snapshot.fat),
    carbs: toNumber(snapshot.carbs),
    kcal: toNumber(snapshot.kcal),
  };
}

function roundMacros(macros: Macros): Macros {
  return {
    protein: round2(macros.protein),
    fat: round2(macros.fat),
    carbs: round2(macros.carbs),
    kcal: round2(macros.kcal),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isMealType(value: unknown): value is MealType {
  return (
    value === "breakfast" ||
    value === "lunch" ||
    value === "snack" ||
    value === "dinner" ||
    value === "pre_workout" ||
    value === "post_workout"
  );
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}
