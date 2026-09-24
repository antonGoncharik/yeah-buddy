import {
  MealTemplateItemNotFoundError,
  TemplateMealHiddenError,
} from "@/lib/meal/errors";
import { mapTemplateItemRow, toItemView } from "@/lib/meal/map";
import type { TemplateItemWriteInput } from "@/lib/meal/schema";
import {
  ensureMealTemplate,
  loadFood,
  loadTemplateDetail,
} from "@/lib/meal/store";
import { getMealOrder, isMealVisible } from "@/lib/nutrition";
import { assertSameIds, orderRanks } from "@/lib/order";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DayType,
  MealTemplateDetail,
  MealTemplateItemView,
  MealType,
} from "@/lib/types";

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

export async function updateTemplateItemsGrams(
  userId: string,
  updates: Array<{ id: string; grams: number }>,
): Promise<void> {
  if (updates.length === 0) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const results = await Promise.all(
    updates.map((update) =>
      supabase
        .from("meal_template_items")
        .update({ grams: update.grams })
        .eq("id", update.id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle(),
    ),
  );

  for (const result of results) {
    if (result.error) {
      throw result.error;
    }
    if (!result.data) {
      throw new MealTemplateItemNotFoundError();
    }
  }
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

export async function reorderTemplateItems(
  userId: string,
  dayType: DayType,
  mealType: MealType,
  itemIds: string[],
): Promise<MealTemplateDetail> {
  if (!isMealVisible(mealType, dayType === "training")) {
    throw new TemplateMealHiddenError();
  }

  const template = await ensureMealTemplate(userId, dayType);
  const current = template.items.filter((item) => item.meal_type === mealType);
  assertSameIds(
    current.map((item) => item.id),
    itemIds,
  );

  const supabase = createSupabaseServerClient();
  const ranks = orderRanks(itemIds, getMealOrder(mealType) * 10);
  const updated = await Promise.all(
    ranks.map((rank) =>
      supabase
        .from("meal_template_items")
        .update({ sort_order: rank.sort_order })
        .eq("user_id", userId)
        .eq("template_id", template.id)
        .eq("id", rank.id),
    ),
  );

  const failed = updated.find((result) => result.error);
  if (failed?.error) {
    throw failed.error;
  }

  return loadTemplateDetail(supabase, userId, template);
}

export async function replaceMealTemplateItems(
  userId: string,
  dayType: DayType,
  items: Array<{
    mealType: MealType;
    foodId: string;
    grams: number;
  }>,
): Promise<MealTemplateDetail> {
  const template = await ensureMealTemplate(userId, dayType);
  const supabase = createSupabaseServerClient();
  const visible = items.filter((item) =>
    isMealVisible(item.mealType, dayType === "training"),
  );

  const deleted = await supabase
    .from("meal_template_items")
    .delete()
    .eq("user_id", userId)
    .eq("template_id", template.id);

  if (deleted.error) {
    throw deleted.error;
  }

  if (visible.length === 0) {
    return loadTemplateDetail(supabase, userId, template);
  }

  const inserted = await supabase.from("meal_template_items").insert(
    visible.map((item, index) => ({
      user_id: userId,
      template_id: template.id,
      meal_type: item.mealType,
      food_id: item.foodId,
      grams: item.grams,
      sort_order: (index + 1) * 10,
    })),
  );

  if (inserted.error) {
    throw inserted.error;
  }

  return loadTemplateDetail(supabase, userId, template);
}
