import { parseFoodState } from "@/lib/food/schema";
import {
  isRecord,
  mapRecordList,
  toNullableNumber,
  toNullableString,
  toNumber,
} from "@/lib/read";
import type { Food } from "@/lib/types";

export function mapFood(row: Record<string, unknown>): Food {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    brand: toNullableString(row.brand),
    state: parseFoodState(row.state),
    protein_per_100: toNumber(row.protein_per_100),
    fat_per_100: toNumber(row.fat_per_100),
    carbs_per_100: toNumber(row.carbs_per_100),
    kcal_per_100: toNumber(row.kcal_per_100),
    default_portion_g: toNullableNumber(row.default_portion_g),
    default_portion_label: toNullableString(row.default_portion_label),
    yield_from_g: toNullableNumber(row.yield_from_g),
    yield_to_g: toNullableNumber(row.yield_to_g),
    is_favorite: Boolean(row.is_favorite),
    notes: toNullableString(row.notes),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function parseFood(value: unknown): Food | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapFood(value);
}

export function readFoodPayload(data: unknown): Food | null {
  return isRecord(data) ? parseFood(data.food) : null;
}

export function parseFoodList(data: unknown, key = "foods"): Food[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data[key], parseFood);
}
