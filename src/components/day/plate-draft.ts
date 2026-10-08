import { parseNonneg } from "@/components/foods/food-form-state";
import { parseRemaining } from "@/lib/ai/parse-review";
import { parsePlateDraft } from "@/lib/ai/plate-parse";
import { PLATE_GRAMS_MAX, type PlateDraftItem } from "@/lib/ai/plate-types";
import { ApiError } from "@/lib/api-cache";
import { LUMP_PORTION_G, macrosFromLump } from "@/lib/day/lump";
import { roundPlateGrams } from "@/lib/ai/plate-match";
import {
  type FoodYield,
  formatYieldGrams,
  type GramsMode,
  parseFoodYield,
  parseGramsInput,
  switchGramsMode,
  toCookedGrams,
  toNativeGrams,
} from "@/lib/food/yield";
import { AI_PLATE_FAILED, readApiError } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import type { Food } from "@/lib/types";

export type PlateRow = PlateDraftItem & {
  rowId: string;
  gramsInput: string;
  gramsMode: GramsMode;
  proteinInput: string;
  fatInput: string;
  carbsInput: string;
};

export type PlatePicker =
  | { mode: "add" }
  | { mode: "replace"; rowId: string }
  | null;

export type PlateStatus =
  | { status: "idle" }
  | { status: "unavailable" }
  | { status: "working"; title: string; previewUrl: string | null }
  | { status: "error"; message: string; previewUrl: string | null }
  | { status: "empty"; previewUrl: string }
  | { status: "draft"; previewUrl: string; items: PlateRow[] }
  | { status: "saving"; previewUrl: string; items: PlateRow[] };

export type PlateLumpPatch = {
  name?: string;
  proteinInput?: string;
  fatInput?: string;
  carbsInput?: string;
};

export { parseGramsInput };

export function rowYield(item: PlateDraftItem): FoodYield | null {
  return item.kind === "food" ? parseFoodYield(item) : null;
}

export function lumpReferenceGrams(item: PlateRow): number {
  if (item.kind !== "lump") {
    return LUMP_PORTION_G;
  }
  const parsed = parseGramsInput(item.gramsInput);
  if (parsed != null && parsed > 0) {
    return Math.min(parsed, PLATE_GRAMS_MAX);
  }
  return item.grams > 0 ? item.grams : LUMP_PORTION_G;
}

export function rowNativeGrams(item: PlateRow): number | null {
  if (item.kind === "lump") {
    const grams = lumpReferenceGrams(item);
    return grams > 0 ? grams : null;
  }
  const grams = parseGramsInput(item.gramsInput);
  if (grams == null) {
    return null;
  }
  const native = toNativeGrams(grams, item.gramsMode, rowYield(item));
  return native > 0 ? native : null;
}

export function toPlateRow(item: PlateDraftItem): PlateRow {
  if (item.kind === "lump") {
    const grams =
      item.grams > 0 ? roundPlateGrams(item.grams) : LUMP_PORTION_G;
    return {
      ...item,
      grams,
      rowId: crypto.randomUUID(),
      gramsInput: formatYieldGrams(grams),
      gramsMode: "native",
      proteinInput: String(item.protein),
      fatInput: String(item.fat),
      carbsInput: String(item.carbs),
    };
  }

  const pair = rowYield(item);
  return {
    ...item,
    rowId: crypto.randomUUID(),
    gramsInput: String(item.grams),
    gramsMode: pair ? "cooked" : "native",
    proteinInput: String(item.protein_per_100),
    fatInput: String(item.fat_per_100),
    carbsInput: String(item.carbs_per_100),
  };
}

export function foodToPlateRow(food: Food, grams: number): PlateRow {
  const pair = parseFoodYield(food);
  const mode: GramsMode = pair ? "cooked" : "native";
  const shown = mode === "cooked" && pair ? toCookedGrams(grams, pair) : grams;
  return toPlateRow({
    kind: "food",
    foodId: food.id,
    name: food.name,
    state: food.state,
    grams: shown,
    protein_per_100: food.protein_per_100,
    fat_per_100: food.fat_per_100,
    carbs_per_100: food.carbs_per_100,
    kcal_per_100: food.kcal_per_100,
    default_portion_g: food.default_portion_g,
    default_portion_label: food.default_portion_label,
    yield_from_g: food.yield_from_g,
    yield_to_g: food.yield_to_g,
  });
}

export function mergeFoodRows(items: PlateRow[]): PlateRow[] {
  const merged: PlateRow[] = [];
  for (const item of items) {
    if (item.kind !== "food") {
      merged.push(item);
      continue;
    }
    const existing = merged.find(
      (entry) => entry.kind === "food" && entry.foodId === item.foodId,
    );
    if (existing?.kind !== "food") {
      merged.push(item);
      continue;
    }
    const pair = rowYield(existing);
    const native =
      (rowNativeGrams(existing) ?? 0) + (rowNativeGrams(item) ?? 0);
    const next = native > 0 ? native : existing.grams;
    const clamped = Math.min(next, PLATE_GRAMS_MAX);
    existing.grams = clamped;
    existing.gramsInput =
      existing.gramsMode === "cooked" && pair
        ? formatYieldGrams(toCookedGrams(clamped, pair))
        : formatYieldGrams(clamped);
  }
  return merged;
}

export function patchLumpRow(item: PlateRow, patch: PlateLumpPatch): PlateRow {
  if (item.kind !== "lump") {
    return item;
  }
  const proteinInput = patch.proteinInput ?? item.proteinInput;
  const fatInput = patch.fatInput ?? item.fatInput;
  const carbsInput = patch.carbsInput ?? item.carbsInput;
  const protein = parseNonneg(proteinInput) ?? item.protein;
  const fat = parseNonneg(fatInput) ?? item.fat;
  const carbs = parseNonneg(carbsInput) ?? item.carbs;
  const macros = macrosFromLump({ protein, fat, carbs });
  const grams = lumpReferenceGrams(item);
  return {
    ...item,
    name: patch.name ?? item.name,
    grams,
    proteinInput,
    fatInput,
    carbsInput,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
  };
}

export function setRowGrams(item: PlateRow, gramsInput: string): PlateRow {
  if (item.kind === "food") {
    return { ...item, gramsInput };
  }

  const prevGrams = lumpReferenceGrams(item);
  const parsed = parseGramsInput(gramsInput);
  if (parsed == null) {
    return { ...item, gramsInput };
  }

  const nextGrams = Math.min(Math.max(parsed, 0), PLATE_GRAMS_MAX);
  if (nextGrams <= 0 || prevGrams <= 0) {
    return { ...item, gramsInput, grams: nextGrams };
  }

  const factor = nextGrams / prevGrams;
  const scaled = macrosFromLump({
    protein: item.protein * factor,
    fat: item.fat * factor,
    carbs: item.carbs * factor,
  });

  return {
    ...item,
    gramsInput,
    grams: roundPlateGrams(nextGrams) || nextGrams,
    proteinInput: formatMacroInput(scaled.protein),
    fatInput: formatMacroInput(scaled.fat),
    carbsInput: formatMacroInput(scaled.carbs),
    protein: scaled.protein,
    fat: scaled.fat,
    carbs: scaled.carbs,
    kcal: scaled.kcal,
  };
}

function formatMacroInput(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
}

export function foodRowFromPick(food: Food): PlateRow {
  const grams =
    food.default_portion_g && food.default_portion_g > 0
      ? food.default_portion_g
      : 100;
  return foodToPlateRow(food, grams);
}

export function emptyLumpRow(): PlateRow {
  return {
    kind: "lump",
    name: "",
    grams: LUMP_PORTION_G,
    protein: 0,
    fat: 0,
    carbs: 0,
    kcal: 0,
    rowId: crypto.randomUUID(),
    gramsInput: formatYieldGrams(LUMP_PORTION_G),
    gramsMode: "native",
    proteinInput: "",
    fatInput: "",
    carbsInput: "",
  };
}

export function foodRowToLump(item: PlateRow): PlateRow {
  if (item.kind !== "food") {
    return item;
  }

  const grams = rowNativeGrams(item) ?? item.grams;
  const macros = macrosFromLump({
    protein: (item.protein_per_100 * grams) / 100,
    fat: (item.fat_per_100 * grams) / 100,
    carbs: (item.carbs_per_100 * grams) / 100,
  });

  const portionGrams = roundPlateGrams(grams) || LUMP_PORTION_G;
  return {
    ...toPlateRow({
      kind: "lump",
      name: item.name,
      grams: portionGrams,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      kcal: macros.kcal,
    }),
    rowId: item.rowId,
  };
}

export function withGramsMode(item: PlateRow, next: GramsMode): PlateRow {
  const pair = rowYield(item);
  if (next === item.gramsMode || !pair) {
    return item;
  }
  const grams = parseGramsInput(item.gramsInput);
  if (grams == null) {
    return { ...item, gramsMode: next };
  }
  return {
    ...item,
    gramsMode: next,
    gramsInput: formatYieldGrams(
      switchGramsMode(grams, item.gramsMode, next, pair),
    ),
  };
}

export async function requestPlateDraft(blob: Blob, signal?: AbortSignal) {
  const body = new FormData();
  body.append("image", blob, "plate.jpg");
  const response = await fetch("/api/ai/plate", {
    method: "POST",
    body,
    signal,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      readApiError(data) ?? AI_PLATE_FAILED,
      response.status,
      data,
    );
  }

  const parsed = parsePlateDraft(data);
  if (!parsed) {
    throw new Error(AI_PLATE_FAILED);
  }

  return {
    items: parsed.items.map(toPlateRow),
    remaining: parseRemaining(isRecord(data) ? data.remaining : null),
  };
}

export function rememberPreview(
  file: File,
  previewRef: { current: string | null },
): string {
  revokePreview(previewRef.current);
  const url = URL.createObjectURL(file);
  previewRef.current = url;
  return url;
}

export function revokePreview(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
