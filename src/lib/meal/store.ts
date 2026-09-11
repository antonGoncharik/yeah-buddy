import { mapFood } from "@/lib/food/map";
import { FoodNotFoundError } from "@/lib/meal/errors";
import {
  mapMealTemplate,
  mapTemplateItemRow,
  toItemView,
} from "@/lib/meal/map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DayType,
  Food,
  MealTemplate,
  MealTemplateDetail,
} from "@/lib/types";

const TEMPLATE_NAMES: Record<DayType, string> = {
  rest: "День отдыха",
  training: "День тренировки",
};

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

export async function loadTemplateDetail(
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

export async function loadFood(
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
