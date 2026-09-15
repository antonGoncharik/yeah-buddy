import { calcKcalFromMacros } from "@/lib/nutrition";
import {
  isRecord,
  mapRecordList,
  toNullableNumber,
  toNullableString,
  toNumber,
} from "@/lib/read";

export const CATALOG_SEARCH_MIN = 2;
export const CATALOG_SEARCH_LIMIT = 40;

export interface CatalogDumpInput {
  source: string;
  source_product_id: string;
  name: string;
  brand: string | null;
  pack_weight_g: number | null;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
}

export interface CatalogFood {
  id: string;
  name: string;
  brand: string | null;
  pack_weight_g: number | null;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
}

export function parseCatalogDumpRow(value: unknown): CatalogDumpInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const source = toNullableString(value.source);
  const sourceProductId = catalogSourceId(value.source_product_id);
  const name = toNullableString(value.name);
  if (!source || !sourceProductId || !name) {
    return null;
  }

  const per100 = isRecord(value.per_100) ? value.per_100 : {};
  const pack = positiveGrams(value.weight_g);

  return {
    source,
    source_product_id: sourceProductId,
    name,
    brand: toNullableString(value.brand),
    pack_weight_g: pack,
    protein_per_100: catalogMacro(per100.protein),
    fat_per_100: catalogMacro(per100.fat),
    carbs_per_100: catalogMacro(per100.carbs),
  };
}

export function mapCatalogFood(row: Record<string, unknown>): CatalogFood {
  const protein = toNumber(row.protein_per_100);
  const fat = toNumber(row.fat_per_100);
  const carbs = toNumber(row.carbs_per_100);
  return {
    id: String(row.id),
    name: String(row.name),
    brand: toNullableString(row.brand),
    pack_weight_g: toNullableNumber(row.pack_weight_g),
    protein_per_100: protein,
    fat_per_100: fat,
    carbs_per_100: carbs,
    kcal_per_100:
      toNumber(row.kcal_per_100) || calcKcalFromMacros(protein, fat, carbs),
  };
}

export function parseCatalogFood(value: unknown): CatalogFood | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapCatalogFood(value);
}

export function parseCatalogFoodList(data: unknown): CatalogFood[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.foods, parseCatalogFood);
}

export function catalogSearchNeedle(raw: string): string | null {
  const trimmed = raw
    .trim()
    .replace(/[%_,.()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (trimmed.length < CATALOG_SEARCH_MIN) {
    return null;
  }

  return trimmed.slice(0, 80);
}

export function catalogDefaultPortion(packWeightG: number | null): {
  grams: number;
  label: string;
} {
  const grams =
    packWeightG != null && packWeightG >= 5 && packWeightG <= 200
      ? packWeightG
      : 100;
  return { grams, label: `${grams} г` };
}

function catalogMacro(value: unknown): number {
  if (value == null || value === "") {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100) / 100;
}

function catalogSourceId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return toNullableString(value);
}

function positiveGrams(value: unknown): number | null {
  const parsed = toNullableNumber(value);
  if (parsed == null || parsed <= 0) {
    return null;
  }

  return parsed;
}
