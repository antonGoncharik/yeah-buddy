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

const FAVORITE_FOODS = new Set([
  "Куриное филе сырое",
  "Яйца куриные",
  "Овсянка сухая",
  "Рис сухой",
  "Творог 5%",
  "Банан",
  "Яблоко",
  "Оливковое масло",
  "Молоко 2.5%",
]);

const STARTER_FOODS: StarterFood[] = [
  {
    name: "Куриное филе сырое",
    state: "raw",
    protein_per_100: 23,
    fat_per_100: 2,
    carbs_per_100: 0,
    kcal_per_100: 110,
    default_portion_g: 150,
    default_portion_label: "150 г",
  },
  {
    name: "Яйца куриные",
    state: "as_is",
    protein_per_100: 13,
    fat_per_100: 11,
    carbs_per_100: 1,
    kcal_per_100: 155,
    default_portion_g: 50,
    default_portion_label: "50 г = 1 шт",
  },
  {
    name: "Творог 5%",
    state: "as_is",
    protein_per_100: 17,
    fat_per_100: 5,
    carbs_per_100: 2,
    kcal_per_100: 121,
    default_portion_g: 150,
    default_portion_label: "150 г",
  },
  {
    name: "Овсянка сухая",
    state: "dry",
    protein_per_100: 13,
    fat_per_100: 6,
    carbs_per_100: 62,
    kcal_per_100: 370,
    default_portion_g: 50,
    default_portion_label: "50 г",
  },
  {
    name: "Рис сухой",
    state: "dry",
    protein_per_100: 7,
    fat_per_100: 1,
    carbs_per_100: 78,
    kcal_per_100: 350,
    default_portion_g: 70,
    default_portion_label: "70 г",
  },
  {
    name: "Гречка сухая",
    state: "dry",
    protein_per_100: 13,
    fat_per_100: 3,
    carbs_per_100: 62,
    kcal_per_100: 330,
    default_portion_g: 70,
    default_portion_label: "70 г",
  },
  {
    name: "Макароны сухие",
    state: "dry",
    protein_per_100: 13,
    fat_per_100: 2,
    carbs_per_100: 71,
    kcal_per_100: 350,
    default_portion_g: 80,
    default_portion_label: "80 г",
  },
  {
    name: "Картофель варёный",
    state: "cooked",
    protein_per_100: 2,
    fat_per_100: 0,
    carbs_per_100: 16,
    kcal_per_100: 80,
    default_portion_g: 200,
    default_portion_label: "200 г",
  },
  {
    name: "Банан",
    state: "as_is",
    protein_per_100: 1,
    fat_per_100: 0,
    carbs_per_100: 23,
    kcal_per_100: 96,
    default_portion_g: 120,
    default_portion_label: "120 г = 1 шт",
  },
  {
    name: "Яблоко",
    state: "as_is",
    protein_per_100: 0,
    fat_per_100: 0,
    carbs_per_100: 14,
    kcal_per_100: 52,
    default_portion_g: 150,
    default_portion_label: "150 г = 1 шт",
  },
  {
    name: "Хлеб пшеничный",
    state: "as_is",
    protein_per_100: 8,
    fat_per_100: 3,
    carbs_per_100: 50,
    kcal_per_100: 260,
    default_portion_g: 40,
    default_portion_label: "40 г = 1 ломтик",
  },
  {
    name: "Оливковое масло",
    state: "liquid",
    protein_per_100: 0,
    fat_per_100: 100,
    carbs_per_100: 0,
    kcal_per_100: 900,
    default_portion_g: 10,
    default_portion_label: "10 мл",
  },
  {
    name: "Молоко 2.5%",
    state: "liquid",
    protein_per_100: 3,
    fat_per_100: 3,
    carbs_per_100: 5,
    kcal_per_100: 52,
    default_portion_g: 200,
    default_portion_label: "200 мл",
  },
  {
    name: "Индейка филе сырое",
    state: "raw",
    protein_per_100: 24,
    fat_per_100: 1,
    carbs_per_100: 0,
    kcal_per_100: 105,
    default_portion_g: 150,
    default_portion_label: "150 г",
  },
  {
    name: "Говядина постная сырая",
    state: "raw",
    protein_per_100: 20,
    fat_per_100: 8,
    carbs_per_100: 0,
    kcal_per_100: 152,
    default_portion_g: 150,
    default_portion_label: "150 г",
  },
  {
    name: "Треска сырая",
    state: "raw",
    protein_per_100: 18,
    fat_per_100: 1,
    carbs_per_100: 0,
    kcal_per_100: 81,
    default_portion_g: 150,
    default_portion_label: "150 г",
  },
  {
    name: "Йогурт натуральный",
    state: "as_is",
    protein_per_100: 4,
    fat_per_100: 3,
    carbs_per_100: 4,
    kcal_per_100: 59,
    default_portion_g: 150,
    default_portion_label: "150 г",
  },
  {
    name: "Кефир 1%",
    state: "liquid",
    protein_per_100: 3,
    fat_per_100: 1,
    carbs_per_100: 4,
    kcal_per_100: 37,
    default_portion_g: 200,
    default_portion_label: "200 мл",
  },
  {
    name: "Чечевица сухая",
    state: "dry",
    protein_per_100: 25,
    fat_per_100: 1,
    carbs_per_100: 53,
    kcal_per_100: 321,
    default_portion_g: 70,
    default_portion_label: "70 г",
  },
  {
    name: "Хлеб ржаной",
    state: "as_is",
    protein_per_100: 7,
    fat_per_100: 1,
    carbs_per_100: 40,
    kcal_per_100: 201,
    default_portion_g: 40,
    default_portion_label: "40 г = 1 ломтик",
  },
  {
    name: "Сливочное масло",
    state: "as_is",
    protein_per_100: 1,
    fat_per_100: 83,
    carbs_per_100: 1,
    kcal_per_100: 755,
    default_portion_g: 10,
    default_portion_label: "10 г",
  },
  {
    name: "Огурец",
    state: "as_is",
    protein_per_100: 1,
    fat_per_100: 0,
    carbs_per_100: 4,
    kcal_per_100: 20,
    default_portion_g: 100,
    default_portion_label: "100 г",
  },
  {
    name: "Помидор",
    state: "as_is",
    protein_per_100: 1,
    fat_per_100: 0,
    carbs_per_100: 4,
    kcal_per_100: 20,
    default_portion_g: 120,
    default_portion_label: "120 г",
  },
  {
    name: "Морковь",
    state: "as_is",
    protein_per_100: 1,
    fat_per_100: 0,
    carbs_per_100: 7,
    kcal_per_100: 32,
    default_portion_g: 80,
    default_portion_label: "80 г",
  },
  {
    name: "Апельсин",
    state: "as_is",
    protein_per_100: 1,
    fat_per_100: 0,
    carbs_per_100: 12,
    kcal_per_100: 52,
    default_portion_g: 150,
    default_portion_label: "150 г = 1 шт",
  },
];

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    name: "День отдыха",
    dayType: "rest",
    items: [
      { mealType: "breakfast", foodName: "Овсянка сухая", grams: 80 },
      { mealType: "breakfast", foodName: "Яйца куриные", grams: 150 },
      { mealType: "lunch", foodName: "Рис сухой", grams: 70 },
      { mealType: "lunch", foodName: "Куриное филе сырое", grams: 200 },
      { mealType: "lunch", foodName: "Оливковое масло", grams: 10 },
      { mealType: "snack", foodName: "Яблоко", grams: 150 },
      { mealType: "dinner", foodName: "Творог 5%", grams: 200 },
      { mealType: "dinner", foodName: "Банан", grams: 120 },
    ],
  },
  {
    name: "День тренировки",
    dayType: "training",
    items: [
      { mealType: "breakfast", foodName: "Овсянка сухая", grams: 80 },
      { mealType: "breakfast", foodName: "Яйца куриные", grams: 150 },
      { mealType: "lunch", foodName: "Рис сухой", grams: 90 },
      { mealType: "lunch", foodName: "Куриное филе сырое", grams: 200 },
      { mealType: "lunch", foodName: "Оливковое масло", grams: 10 },
      { mealType: "pre_workout", foodName: "Банан", grams: 120 },
      { mealType: "post_workout", foodName: "Молоко 2.5%", grams: 200 },
      { mealType: "dinner", foodName: "Творог 5%", grams: 200 },
      { mealType: "dinner", foodName: "Яблоко", grams: 150 },
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
    .select("name")
    .eq("user_id", userId);

  if (existing.error) {
    throw existing.error;
  }

  const have = new Set(
    (existing.data ?? [])
      .map((row) => row.name)
      .filter((name): name is string => typeof name === "string"),
  );
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
  template: StarterTemplate,
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
