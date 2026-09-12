import {
  PLATE_ITEM_LIMIT,
  type PlateDraft,
  type PlateDraftItem,
  type PlateModelItem,
} from "@/lib/ai/plate-types";
import { parseFoodState } from "@/lib/foods";
import {
  isRecord,
  mapRecordList,
  toNullableNumber,
  toNullableString,
  toNumber,
} from "@/lib/read";

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
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (name === "") {
    return null;
  }

  if (value.kind === "lump") {
    const protein = toNumber(value.protein);
    const fat = toNumber(value.fat);
    const carbs = toNumber(value.carbs);
    const kcal = toNumber(value.kcal);
    if (
      protein < 0 ||
      fat < 0 ||
      carbs < 0 ||
      kcal < 0 ||
      protein + fat + carbs <= 0
    ) {
      return null;
    }
    return {
      kind: "lump",
      name: name.slice(0, 80),
      protein,
      fat,
      carbs,
      kcal,
    };
  }

  const grams = toNumber(value.grams);
  if (!Number.isFinite(grams) || grams <= 0) {
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
      state: parseFoodState(value.state),
      grams,
      protein_per_100: protein,
      fat_per_100: fat,
      carbs_per_100: carbs,
      kcal_per_100: kcal,
      default_portion_g: toNullableNumber(value.default_portion_g),
      default_portion_label: toNullableString(value.default_portion_label),
      yield_from_g: toNullableNumber(value.yield_from_g),
      yield_to_g: toNullableNumber(value.yield_to_g),
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
  const protein = readOptionalMacro(value.protein);
  const fat = readOptionalMacro(value.fat);
  const carbs = readOptionalMacro(value.carbs);
  const hasPortion =
    protein != null &&
    fat != null &&
    carbs != null &&
    protein + fat + carbs > 0;
  if (!hasPortion && (!Number.isFinite(grams) || grams <= 0)) {
    return null;
  }

  return {
    catalog_i: readCatalogIndex(value.catalog_i),
    name: name.slice(0, 80),
    grams: Number.isFinite(grams) && grams > 0 ? grams : 0,
    state: parseFoodState(value.state),
    protein,
    fat,
    carbs,
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
