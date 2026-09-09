import { mapMealItem } from "@/lib/day/map";
import { parseFood } from "@/lib/foods";
import { isDayType, isMealType } from "@/lib/nutrition";
import { isRecord, mapRecordList, toNumber } from "@/lib/read";
import type {
  MealItem,
  MealTemplateDetail,
  MealTemplateItemView,
} from "@/lib/types";

export function parseMealItem(value: unknown): MealItem | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapMealItem(value);
}

export function readMealItemPayload(data: unknown): MealItem | null {
  return isRecord(data) ? parseMealItem(data.item) : null;
}

export function parseMealTemplateItemView(
  value: unknown,
): MealTemplateItemView | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  const food = parseFood(value.food);
  if (!food) {
    return null;
  }

  return {
    id: value.id,
    user_id: String(value.user_id ?? ""),
    template_id: String(value.template_id ?? ""),
    meal_type: isMealType(value.meal_type) ? value.meal_type : "snack",
    food_id: String(value.food_id ?? food.id),
    grams: toNumber(value.grams),
    sort_order: toNumber(value.sort_order),
    created_at: String(value.created_at ?? ""),
    food,
    protein: toNumber(value.protein),
    fat: toNumber(value.fat),
    carbs: toNumber(value.carbs),
    kcal: toNumber(value.kcal),
  };
}

export function readMealTemplateItemPayload(
  data: unknown,
): MealTemplateItemView | null {
  return isRecord(data) ? parseMealTemplateItemView(data.item) : null;
}

export function parseMealTemplateDetail(
  value: unknown,
): MealTemplateDetail | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    id: value.id,
    user_id: String(value.user_id ?? ""),
    name: String(value.name ?? ""),
    day_type: isDayType(value.day_type) ? value.day_type : "rest",
    is_active: Boolean(value.is_active),
    created_at: String(value.created_at ?? ""),
    updated_at: String(value.updated_at ?? ""),
    items: mapRecordList(value.items, (row) => parseMealTemplateItemView(row)),
  };
}

export function readMealTemplatePayload(
  data: unknown,
): MealTemplateDetail | null {
  return isRecord(data) ? parseMealTemplateDetail(data.template) : null;
}

export function readMealTemplatesPayload(
  data: unknown,
): MealTemplateDetail[] | null {
  if (!isRecord(data) || !Array.isArray(data.templates)) {
    return null;
  }

  return mapRecordList(data.templates, (row) => parseMealTemplateDetail(row));
}
