import { z } from "zod";

import { mapFood } from "@/lib/foods";
import { TEMPLATE_MEAL_HIDDEN } from "@/lib/messages";
import {
  calcMacrosFromPer100,
  getMealOrder,
  isDayType,
  isMealType,
  isMealVisible,
  roundMacros,
} from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DayType,
  Food,
  MealTemplate,
  MealTemplateDetail,
  MealTemplateItemView,
  MealType,
} from "@/lib/types";

const TEMPLATE_NAMES: Record<DayType, string> = {
  rest: "День отдыха",
  training: "День тренировки",
};

export class MealTemplateItemNotFoundError extends Error {
  constructor() {
    super("Запись не найдена.");
  }
}

export class TemplateMealHiddenError extends Error {
  constructor() {
    super(TEMPLATE_MEAL_HIDDEN);
  }
}

export class FoodNotFoundError extends Error {
  constructor() {
    super("Продукт не найден.");
  }
}

export const templateItemWriteSchema = z.object({
  mealType: z.enum([
    "breakfast",
    "lunch",
    "snack",
    "dinner",
    "pre_workout",
    "post_workout",
  ]),
  foodId: z.string().min(1),
  grams: z.number().finite().positive(),
});

export const templateItemGramsSchema = z.object({
  grams: z.number().finite().positive(),
});

export type TemplateItemWriteInput = z.infer<typeof templateItemWriteSchema>;

export { isDayType };

export async function listMealTemplates(
  userId: string,
): Promise<MealTemplateDetail[]> {
  const rest = await ensureMealTemplate(userId, "rest");
  const training = await ensureMealTemplate(userId, "training");
  return [rest, training];
}

export async function getActiveMealTemplate(
  userId: string,
  dayType: DayType,
): Promise<MealTemplateDetail | null> {
  const supabase = createSupabaseServerClient();
  const template = await findActiveTemplate(supabase, userId, dayType);
  if (!template) {
    return null;
  }

  return loadTemplateDetail(supabase, userId, template);
}

export async function ensureMealTemplate(
  userId: string,
  dayType: DayType,
): Promise<MealTemplateDetail> {
  const supabase = createSupabaseServerClient();
  const existing = await findActiveTemplate(supabase, userId, dayType);
  if (existing) {
    return loadTemplateDetail(supabase, userId, existing);
  }

  const created = await supabase
    .from("meal_templates")
    .insert({
      user_id: userId,
      name: TEMPLATE_NAMES[dayType],
      day_type: dayType,
      is_active: true,
    })
    .select("*")
    .single();

  if (created.error) {
    const raced = await findActiveTemplate(supabase, userId, dayType);
    if (raced) {
      return loadTemplateDetail(supabase, userId, raced);
    }
    throw created.error;
  }

  return loadTemplateDetail(
    supabase,
    userId,
    mapMealTemplate(created.data as Record<string, unknown>),
  );
}

export async function addTemplateItem(
  userId: string,
  dayType: DayType,
  input: TemplateItemWriteInput,
): Promise<MealTemplateItemView> {
  if (!isMealVisible(input.mealType, dayType === "training")) {
    throw new TemplateMealHiddenError();
  }

  const template = await ensureMealTemplate(userId, dayType);
  const supabase = createSupabaseServerClient();
  const food = await loadFood(supabase, userId, input.foodId);
  const sortOrder =
    Math.max(
      getMealOrder(input.mealType) - 1,
      ...template.items
        .filter((item) => item.meal_type === input.mealType)
        .map((item) => item.sort_order),
    ) + 1;

  const inserted = await supabase
    .from("meal_template_items")
    .insert({
      user_id: userId,
      template_id: template.id,
      meal_type: input.mealType,
      food_id: food.id,
      grams: input.grams,
      sort_order: sortOrder,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Template item insert failed");
  }

  return toItemView(
    mapTemplateItemRow(inserted.data as Record<string, unknown>),
    food,
  );
}

export async function getTemplateItem(
  userId: string,
  itemId: string,
): Promise<MealTemplateItemView | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("meal_template_items")
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

  const row = mapTemplateItemRow(result.data as Record<string, unknown>);
  const food = await loadFood(supabase, userId, row.food_id);
  return toItemView(row, food);
}

export async function updateTemplateItemGrams(
  userId: string,
  itemId: string,
  grams: number,
): Promise<MealTemplateItemView> {
  const item = await getTemplateItem(userId, itemId);
  if (!item) {
    throw new MealTemplateItemNotFoundError();
  }

  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("meal_template_items")
    .update({ grams })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    throw new MealTemplateItemNotFoundError();
  }

  return toItemView(
    mapTemplateItemRow(updated.data as Record<string, unknown>),
    item.food,
  );
}

export async function deleteTemplateItem(
  userId: string,
  itemId: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("meal_template_items")
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

async function findActiveTemplate(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  dayType: DayType,
): Promise<MealTemplate | null> {
  const result = await supabase
    .from("meal_templates")
    .select("*")
    .eq("user_id", userId)
    .eq("day_type", dayType)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapMealTemplate(result.data as Record<string, unknown>);
}

async function loadTemplateDetail(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  template: MealTemplate,
): Promise<MealTemplateDetail> {
  const items = await supabase
    .from("meal_template_items")
    .select("*")
    .eq("user_id", userId)
    .eq("template_id", template.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (items.error) {
    throw items.error;
  }

  const rows = (items.data ?? []).map((row) =>
    mapTemplateItemRow(row as Record<string, unknown>),
  );
  const foodIds = [...new Set(rows.map((row) => row.food_id))];
  const foodById = await loadFoodsById(supabase, userId, foodIds);

  return {
    ...template,
    items: rows.flatMap((row) => {
      const food = foodById.get(row.food_id);
      return food ? [toItemView(row, food)] : [];
    }),
  };
}

async function loadFoodsById(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  foodIds: string[],
): Promise<Map<string, Food>> {
  if (foodIds.length === 0) {
    return new Map();
  }

  const foods = await supabase
    .from("foods")
    .select("*")
    .eq("user_id", userId)
    .in("id", foodIds);

  if (foods.error) {
    throw foods.error;
  }

  return new Map(
    (foods.data ?? []).map((row) => {
      const food = mapFood(row as Record<string, unknown>);
      return [food.id, food];
    }),
  );
}

async function loadFood(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  foodId: string,
): Promise<Food> {
  const result = await supabase
    .from("foods")
    .select("*")
    .eq("id", foodId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    throw new FoodNotFoundError();
  }

  return mapFood(result.data as Record<string, unknown>);
}

function toItemView(
  row: {
    id: string;
    user_id: string;
    template_id: string;
    meal_type: MealType;
    food_id: string;
    grams: number;
    sort_order: number;
    created_at: string;
  },
  food: Food,
): MealTemplateItemView {
  const macros = roundMacros(
    calcMacrosFromPer100(
      {
        protein: food.protein_per_100,
        fat: food.fat_per_100,
        carbs: food.carbs_per_100,
        kcal: food.kcal_per_100,
      },
      row.grams,
    ),
  );

  return {
    ...row,
    food,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
  };
}

function mapMealTemplate(row: Record<string, unknown>): MealTemplate {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    day_type: isDayType(row.day_type) ? row.day_type : "rest",
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapTemplateItemRow(row: Record<string, unknown>): {
  id: string;
  user_id: string;
  template_id: string;
  meal_type: MealType;
  food_id: string;
  grams: number;
  sort_order: number;
  created_at: string;
} {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    template_id: String(row.template_id),
    meal_type: isMealType(row.meal_type) ? row.meal_type : "snack",
    food_id: String(row.food_id),
    grams: toNumber(row.grams),
    sort_order: toNumber(row.sort_order),
    created_at: String(row.created_at),
  };
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
