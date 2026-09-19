import { getDateForMeal } from "@/lib/day/meal-items";
import { getDayByDate } from "@/lib/day/store";
import { getFood } from "@/lib/food/store";
import { listMealTemplates } from "@/lib/meal-templates";
import { NAMED_MEAL_EMPTY, PACK_EMPTY_MEALS } from "@/lib/messages";
import { getNamedMealDetail } from "@/lib/named-meal/read";
import { getMealLabel } from "@/lib/nutrition";
import { getUserSettings } from "@/lib/settings";
import { findClone } from "@/lib/share/pack-load";
import { mapPackRow, type PackRow } from "@/lib/share/pack-map";
import {
  buildMealPayload,
  buildMealsPayload,
  buildWorkoutsPayload,
  PackEmptyError,
  type PackFood,
  type SharePackKind,
  type SharePackPayload,
} from "@/lib/share/payload";
import { createPackToken } from "@/lib/share/token";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food, MealItem, NamedMealItem } from "@/lib/types";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import { listTemplates } from "@/lib/workout/templates";

export async function snapshotLive(
  userId: string,
  kind: SharePackKind,
): Promise<SharePackPayload> {
  if (kind === "meal") {
    throw new PackEmptyError(PACK_EMPTY_MEALS);
  }
  if (kind === "meals") {
    const settings = await getUserSettings(userId);
    if (!settings) {
      throw new PackEmptyError(PACK_EMPTY_MEALS);
    }
    const templates = await listMealTemplates(userId);
    return buildMealsPayload(settings, templates);
  }

  const settings = await ensureWorkoutSettings(userId);
  const templates = await listTemplates(userId);
  return buildWorkoutsPayload(settings, templates);
}

export async function snapshotMealPack(
  userId: string,
  source: { mealId?: string; namedMealId?: string },
): Promise<ReturnType<typeof buildMealPayload>> {
  if (source.namedMealId) {
    const named = await getNamedMealDetail(userId, source.namedMealId);
    if (!named || named.items.length === 0) {
      throw new PackEmptyError(NAMED_MEAL_EMPTY);
    }
    const foods = await foodsForItems(userId, named.items);
    return buildMealPayload({
      name: named.name,
      mealType: named.meal_type,
      foods: [...foods.values()],
      items: named.items.map((item) => ({
        food: foodForItem(item, foods.get(item.food_id ?? "")),
        grams: item.grams,
      })),
    });
  }

  const mealId = source.mealId;
  if (!mealId) {
    throw new PackEmptyError(NAMED_MEAL_EMPTY);
  }

  const date = await getDateForMeal(userId, mealId);
  if (!date) {
    throw new PackEmptyError(NAMED_MEAL_EMPTY);
  }
  const day = await getDayByDate(userId, date);
  const meal = day?.meals.find((entry) => entry.id === mealId);
  if (!meal || meal.items.length === 0) {
    throw new PackEmptyError(NAMED_MEAL_EMPTY);
  }

  const foods = await foodsForItems(userId, meal.items);
  return buildMealPayload({
    name: getMealLabel(meal.meal_type),
    mealType: meal.meal_type,
    foods: [...foods.values()],
    items: meal.items.map((item) => ({
      food: foodForItem(item, foods.get(item.food_id ?? "")),
      grams: item.grams,
    })),
  });
}

export async function insertPack(input: {
  ownerUserId: string;
  sourcePackId: string | null;
  kind: SharePackKind;
  title: string;
  payload: SharePackPayload;
}): Promise<PackRow> {
  const supabase = createSupabaseServerClient();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = createPackToken();
    const inserted = await supabase
      .from("share_packs")
      .insert({
        owner_user_id: input.ownerUserId,
        source_pack_id: input.sourcePackId,
        kind: input.kind,
        token,
        title: input.title,
        payload: input.payload,
      })
      .select(
        "id, owner_user_id, source_pack_id, kind, token, title, payload, revoked_at, created_at",
      )
      .single();

    if (inserted.error) {
      if (inserted.error.code === "23505") {
        if (input.sourcePackId) {
          const existing = await findClone(
            input.ownerUserId,
            input.sourcePackId,
          );
          if (existing) {
            return existing;
          }
        }
        continue;
      }
      throw inserted.error;
    }

    const row = mapPackRow(inserted.data as Record<string, unknown>);
    if (!row) {
      throw new Error("Pack insert failed");
    }
    return row;
  }

  throw new Error("Pack token collision");
}

async function foodsForItems(
  userId: string,
  items: Array<MealItem | NamedMealItem>,
): Promise<Map<string, Food>> {
  const foods = new Map<string, Food>();
  const ids = [
    ...new Set(items.flatMap((item) => (item.food_id ? [item.food_id] : []))),
  ];
  for (const id of ids) {
    const food = await getFood(userId, id);
    if (food) {
      foods.set(id, food);
    }
  }
  return foods;
}

function foodForItem(
  item: MealItem | NamedMealItem,
  food: Food | undefined,
): PackFood {
  if (food) {
    return packFoodFromCatalog(food);
  }
  return {
    name: item.name_snapshot,
    brand: null,
    state: "as_is",
    protein_per_100: item.per_100_snapshot.protein,
    fat_per_100: item.per_100_snapshot.fat,
    carbs_per_100: item.per_100_snapshot.carbs,
    kcal_per_100: item.per_100_snapshot.kcal,
    default_portion_g: item.grams,
    default_portion_label: null,
    yield_from_g: null,
    yield_to_g: null,
    is_favorite: false,
  };
}

function packFoodFromCatalog(food: Food): PackFood {
  return {
    name: food.name,
    brand: food.brand,
    state: food.state,
    protein_per_100: food.protein_per_100,
    fat_per_100: food.fat_per_100,
    carbs_per_100: food.carbs_per_100,
    kcal_per_100: food.kcal_per_100,
    default_portion_g: food.default_portion_g,
    default_portion_label: food.default_portion_label,
    yield_from_g: food.yield_from_g,
    yield_to_g: food.yield_to_g,
    is_favorite: food.is_favorite,
  };
}
