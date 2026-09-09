import { parseFood } from "@/lib/foods";
import { isDayType, isMealType } from "@/lib/nutrition";
import { isRecord, mapRecordList } from "@/lib/read";
import type {
  MealItem,
  MealTemplateDetail,
  MealTemplateItemView,
} from "@/lib/types";

export function parseMealItem(value: unknown): MealItem | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    id: value.id,
    user_id: String(value.user_id ?? ""),
    meal_id: String(value.meal_id ?? ""),
    food_id: typeof value.food_id === "string" ? value.food_id : null,
    name_snapshot: String(value.name_snapshot ?? ""),
    grams: toNumber(value.grams),
    protein: toNumber(value.protein),
    fat: toNumber(value.fat),
    carbs: toNumber(value.carbs),
    kcal: toNumber(value.kcal),
    per_100_snapshot: parsePer100(value.per_100_snapshot),
    created_at: String(value.created_at ?? ""),
    updated_at: String(value.updated_at ?? ""),
  };
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

function parsePer100(value: unknown): {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
} {
  if (!isRecord(value)) {
    return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }

  return {
    protein: toNumber(value.protein),
    fat: toNumber(value.fat),
    carbs: toNumber(value.carbs),
    kcal: toNumber(value.kcal),
  };
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
