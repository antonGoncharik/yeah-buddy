import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayType, FoodState, MealType } from "@/lib/types";
import { ensureStarterExercises } from "@/lib/workout/seed";

const MEAL_SORT: Record<MealType, number> = {
  breakfast: 10,
  lunch: 20,
  snack: 30,
  pre_workout: 40,
  post_workout: 50,
  dinner: 60,
};

type StarterFood = {
  name: string;
  state: FoodState;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
  default_portion_g: number;
  default_portion_label: string;
};

type StarterTemplateItem = {
  mealType: MealType;
  foodName: string;
  grams: number;
};

type StarterTemplate = {
  name: string;
  dayType: DayType;
  items: StarterTemplateItem[];
};

const STARTER_FOODS: StarterFood[] = [
  {
    name: "Овес резаный сухой",
    state: "dry",
    protein_per_100: 12,
    fat_per_100: 6,
    carbs_per_100: 62,
    kcal_per_100: 350,
    default_portion_g: 100,
    default_portion_label: "100 г",
  },
  {
    name: "Яйца куриные",
    state: "as_is",
    protein_per_100: 13.3,
    fat_per_100: 12,
    carbs_per_100: 0.7,
    kcal_per_100: 167,
    default_portion_g: 150,
    default_portion_label: "150 г = 3 шт",
  },
  {
    name: "Макароны сухие",
    state: "dry",
    protein_per_100: 14,
    fat_per_100: 2,
    carbs_per_100: 70,
    kcal_per_100: 354,
    default_portion_g: 100,
    default_portion_label: "100 г",
  },
  {
    name: "Томатная паста",
    state: "as_is",
    protein_per_100: 1,
    fat_per_100: 3,
    carbs_per_100: 6,
    kcal_per_100: 55,
    default_portion_g: 100,
    default_portion_label: "100 г",
  },
  {
    name: "Куриное филе сырое",
    state: "raw",
    protein_per_100: 23,
    fat_per_100: 1,
    carbs_per_100: 0,
    kcal_per_100: 101,
    default_portion_g: 200,
    default_portion_label: "200 г",
  },
  {
    name: "Филе минтая сырое",
    state: "raw",
    protein_per_100: 20,
    fat_per_100: 1,
    carbs_per_100: 0,
    kcal_per_100: 89,
    default_portion_g: 300,
    default_portion_label: "300 г",
  },
  {
    name: "Тунец сырой",
    state: "raw",
    protein_per_100: 23,
    fat_per_100: 1,
    carbs_per_100: 0,
    kcal_per_100: 101,
    default_portion_g: 200,
    default_portion_label: "200 г",
  },
  {
    name: "Фета",
    state: "as_is",
    protein_per_100: 13,
    fat_per_100: 14,
    carbs_per_100: 2,
    kcal_per_100: 186,
    default_portion_g: 62.5,
    default_portion_label: "62.5 г",
  },
  {
    name: "Оливковое масло",
    state: "liquid",
    protein_per_100: 0,
    fat_per_100: 100,
    carbs_per_100: 0,
    kcal_per_100: 900,
    default_portion_g: 5,
    default_portion_label: "5 мл",
  },
  {
    name: "Протеин",
    state: "as_is",
    protein_per_100: 80,
    fat_per_100: 6,
    carbs_per_100: 2,
    kcal_per_100: 382,
    default_portion_g: 50,
    default_portion_label: "50 г",
  },
  {
    name: "Банан",
    state: "as_is",
    protein_per_100: 1.5,
    fat_per_100: 0.3,
    carbs_per_100: 21,
    kcal_per_100: 89,
    default_portion_g: 110,
    default_portion_label: "110 г = 1 шт",
  },
  {
    name: "Творог",
    state: "as_is",
    protein_per_100: 17,
    fat_per_100: 5,
    carbs_per_100: 1.5,
    kcal_per_100: 119,
    default_portion_g: 200,
    default_portion_label: "200 г",
  },
  {
    name: "Экспонента",
    state: "as_is",
    protein_per_100: 12.5,
    fat_per_100: 0,
    carbs_per_100: 3.1,
    kcal_per_100: 63,
    default_portion_g: 160,
    default_portion_label: "160 г",
  },
  {
    name: "Грецкие орехи",
    state: "as_is",
    protein_per_100: 15,
    fat_per_100: 60,
    carbs_per_100: 10,
    kcal_per_100: 640,
    default_portion_g: 20,
    default_portion_label: "20 г",
  },
  {
    name: "Рис сухой",
    state: "dry",
    protein_per_100: 7,
    fat_per_100: 1,
    carbs_per_100: 71,
    kcal_per_100: 321,
    default_portion_g: 100,
    default_portion_label: "100 г",
  },
];

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    name: "День отдыха",
    dayType: "rest",
    items: [
      { mealType: "breakfast", foodName: "Овес резаный сухой", grams: 80 },
      { mealType: "breakfast", foodName: "Яйца куриные", grams: 150 },
      { mealType: "lunch", foodName: "Макароны сухие", grams: 80 },
      { mealType: "lunch", foodName: "Томатная паста", grams: 100 },
      { mealType: "lunch", foodName: "Куриное филе сырое", grams: 200 },
      { mealType: "lunch", foodName: "Фета", grams: 62.5 },
      { mealType: "lunch", foodName: "Оливковое масло", grams: 5 },
      { mealType: "snack", foodName: "Протеин", grams: 50 },
      { mealType: "dinner", foodName: "Творог", grams: 200 },
      { mealType: "dinner", foodName: "Экспонента", grams: 160 },
      { mealType: "dinner", foodName: "Грецкие орехи", grams: 20 },
    ],
  },
  {
    name: "День тренировки",
    dayType: "training",
    items: [
      { mealType: "breakfast", foodName: "Овес резаный сухой", grams: 100 },
      { mealType: "breakfast", foodName: "Яйца куриные", grams: 150 },
      { mealType: "lunch", foodName: "Макароны сухие", grams: 100 },
      { mealType: "lunch", foodName: "Томатная паста", grams: 100 },
      { mealType: "lunch", foodName: "Куриное филе сырое", grams: 200 },
      { mealType: "lunch", foodName: "Фета", grams: 62.5 },
      { mealType: "lunch", foodName: "Оливковое масло", grams: 5 },
      { mealType: "pre_workout", foodName: "Банан", grams: 110 },
      { mealType: "post_workout", foodName: "Банан", grams: 110 },
      { mealType: "post_workout", foodName: "Протеин", grams: 50 },
      { mealType: "dinner", foodName: "Творог", grams: 200 },
      { mealType: "dinner", foodName: "Экспонента", grams: 160 },
      { mealType: "dinner", foodName: "Грецкие орехи", grams: 20 },
    ],
  },
];

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
  const existing = await supabase
    .from("foods")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (existing.error) {
    throw existing.error;
  }

  if ((existing.count ?? 0) > 0) {
    return;
  }

  const inserted = await supabase.from("foods").insert(
    STARTER_FOODS.map((food) => ({
      user_id: userId,
      name: food.name,
      state: food.state,
      protein_per_100: food.protein_per_100,
      fat_per_100: food.fat_per_100,
      carbs_per_100: food.carbs_per_100,
      kcal_per_100: food.kcal_per_100,
      default_portion_g: food.default_portion_g,
      default_portion_label: food.default_portion_label,
      is_favorite: true,
    })),
  );

  if (inserted.error && inserted.error.code !== "23505") {
    throw inserted.error;
  }
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

  for (const template of STARTER_TEMPLATES) {
    const templateId = await getOrCreateTemplate(supabase, userId, template);
    await ensureTemplateItems(
      supabase,
      userId,
      templateId,
      template.items,
      foodIdByName,
    );
  }
}

async function getOrCreateTemplate(
  supabase: SupabaseClient,
  userId: string,
  template: StarterTemplate,
): Promise<string> {
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
    return existing.data.id;
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
    if (created.error.code === "23505") {
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

      return raced.data.id;
    }

    throw created.error;
  }

  if (typeof created.data.id !== "string") {
    throw new Error("Template insert returned no id");
  }

  return created.data.id;
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
      sort_order: MEAL_SORT[item.mealType] + index,
    });
  }

  if (rows.length === 0) {
    return;
  }

  const inserted = await supabase.from("meal_template_items").insert(rows);
  if (inserted.error && inserted.error.code !== "23505") {
    throw inserted.error;
  }
}
