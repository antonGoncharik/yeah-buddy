import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FAVORITE_FOODS,
  STARTER_FOODS,
  STARTER_MEAL_TEMPLATES,
  type StarterMealTemplate,
  type StarterTemplateItem,
} from "@/lib/food/starter";
import { getMealOrder } from "@/lib/nutrition";
import {
  seededNames,
  throwUnlessUniqueViolation,
  UNIQUE_VIOLATION,
} from "@/lib/seed-missing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealType } from "@/lib/types";
import { ensureStarterExercises } from "@/lib/workout/seed";

export async function ensureInitialData(userId: string): Promise<void> {
  if (!userId) {
    throw new Error("User id is required");
  }

  const supabase = createSupabaseServerClient();
  await ensureStarterFoods(supabase, userId);
  await ensureStarterTemplates(supabase, userId);
  await ensureStarterExercises(supabase, userId);
}

async function ensureStarterFoods(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const have = await seededNames(supabase, "foods", userId);
  const missing = STARTER_FOODS.filter((food) => !have.has(food.name));
  if (missing.length === 0) {
    return;
  }

  const inserted = await supabase.from("foods").insert(
    missing.map((food) => ({
      user_id: userId,
      name: food.name,
      state: food.state,
      protein_per_100: food.protein_per_100,
      fat_per_100: food.fat_per_100,
      carbs_per_100: food.carbs_per_100,
      kcal_per_100: food.kcal_per_100,
      default_portion_g: food.default_portion_g,
      default_portion_label: food.default_portion_label,
      is_favorite: FAVORITE_FOODS.has(food.name),
    })),
  );

  throwUnlessUniqueViolation(inserted.error);
}

async function ensureStarterTemplates(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const foods = await supabase
    .from("foods")
    .select("id, name")
    .eq("user_id", userId);

  if (foods.error) {
    throw foods.error;
  }

  const foodIdByName = new Map<string, string>();
  for (const food of foods.data ?? []) {
    if (typeof food.id === "string" && typeof food.name === "string") {
      foodIdByName.set(food.name, food.id);
    }
  }

  for (const template of STARTER_MEAL_TEMPLATES) {
    const created = await getOrCreateTemplate(supabase, userId, template);
    if (!created.created) {
      continue;
    }

    await ensureTemplateItems(
      supabase,
      userId,
      created.id,
      template.items,
      foodIdByName,
    );
  }
}

async function getOrCreateTemplate(
  supabase: SupabaseClient,
  userId: string,
  template: StarterMealTemplate,
): Promise<{ id: string; created: boolean }> {
  const existing = await supabase
    .from("meal_templates")
    .select("id")
    .eq("user_id", userId)
    .eq("day_type", template.dayType)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data && typeof existing.data.id === "string") {
    return { id: existing.data.id, created: false };
  }

  const created = await supabase
    .from("meal_templates")
    .insert({
      user_id: userId,
      name: template.name,
      day_type: template.dayType,
      is_active: true,
    })
    .select("id")
    .single();

  if (created.error) {
    if (created.error.code === UNIQUE_VIOLATION) {
      const raced = await supabase
        .from("meal_templates")
        .select("id")
        .eq("user_id", userId)
        .eq("day_type", template.dayType)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (raced.error || typeof raced.data?.id !== "string") {
        throw raced.error ?? new Error("Template lookup failed");
      }

      return { id: raced.data.id, created: false };
    }

    throw created.error;
  }

  if (typeof created.data.id !== "string") {
    throw new Error("Template insert returned no id");
  }

  return { id: created.data.id, created: true };
}

async function ensureTemplateItems(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
  items: StarterTemplateItem[],
  foodIdByName: Map<string, string>,
): Promise<void> {
  const existing = await supabase
    .from("meal_template_items")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);

  if (existing.error) {
    throw existing.error;
  }

  if ((existing.count ?? 0) > 0) {
    return;
  }

  const rows = [];
  const mealIndex: Partial<Record<MealType, number>> = {};

  for (const item of items) {
    const foodId = foodIdByName.get(item.foodName);
    if (!foodId) {
      throw new Error(`Starter food not found: ${item.foodName}`);
    }

    const index = mealIndex[item.mealType] ?? 0;
    mealIndex[item.mealType] = index + 1;

    rows.push({
      user_id: userId,
      template_id: templateId,
      meal_type: item.mealType,
      food_id: foodId,
      grams: item.grams,
      sort_order: getMealOrder(item.mealType) + index,
    });
  }

  if (rows.length === 0) {
    return;
  }

  const inserted = await supabase.from("meal_template_items").insert(rows);
  throwUnlessUniqueViolation(inserted.error);
}
