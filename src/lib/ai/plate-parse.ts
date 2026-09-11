import {
  PLATE_ITEM_LIMIT,
  type PlateDraft,
  type PlateDraftItem,
  type PlateModelItem,
} from "@/lib/ai/plate-types";
import { parseFoodState } from "@/lib/foods";
import { isRecord, mapRecordList, toNumber } from "@/lib/read";

export function parsePlateModelItems(value: unknown): PlateModelItem[] | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!Array.isArray(value.items)) {
    return null;
  }

  return mapRecordList(value.items, parsePlateModelItem).slice(
    0,
    PLATE_ITEM_LIMIT,
  );
}

export function parsePlateDraft(value: unknown): PlateDraft | null {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return null;
  }

  const items = mapRecordList(value.items, parsePlateDraftItem);
  if (items.length !== value.items.length) {
    return null;
  }

  return { items };
}

export function parsePlateDraftItem(
  value: Record<string, unknown>,
): PlateDraftItem | null {
  const grams = toNumber(value.grams);
  if (!Number.isFinite(grams) || grams <= 0) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (name === "") {
    return null;
  }

  const protein = toNumber(value.protein_per_100);
  const fat = toNumber(value.fat_per_100);
  const carbs = toNumber(value.carbs_per_100);
  const kcal = toNumber(value.kcal_per_100);
  if (protein < 0 || fat < 0 || carbs < 0 || kcal < 0) {
    return null;
  }

  if (value.kind === "food") {
    if (typeof value.foodId !== "string" || value.foodId.trim() === "") {
      return null;
    }
    return {
      kind: "food",
      foodId: value.foodId,
      name,
      grams,
      protein_per_100: protein,
      fat_per_100: fat,
      carbs_per_100: carbs,
      kcal_per_100: kcal,
    };
  }

  if (value.kind === "new") {
    return {
      kind: "new",
      name: name.slice(0, 80),
      state: parseFoodState(value.state),
      grams,
      protein_per_100: protein,
      fat_per_100: fat,
      carbs_per_100: carbs,
      kcal_per_100: kcal,
    };
  }

  return null;
}

function parsePlateModelItem(
  value: Record<string, unknown>,
): PlateModelItem | null {
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (name === "") {
    return null;
  }

  const grams = toNumber(value.grams);
  if (!Number.isFinite(grams) || grams <= 0) {
    return null;
  }

  return {
    catalog_i: readCatalogIndex(value.catalog_i),
    name: name.slice(0, 80),
    grams,
    state: parseFoodState(value.state),
    protein_per_100: readOptionalMacro(value.protein_per_100),
    fat_per_100: readOptionalMacro(value.fat_per_100),
    carbs_per_100: readOptionalMacro(value.carbs_per_100),
  };
}

function readCatalogIndex(value: unknown): number {
  if (value == null || value === "") {
    return -1;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return -1;
  }
  return parsed;
}

function readOptionalMacro(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
