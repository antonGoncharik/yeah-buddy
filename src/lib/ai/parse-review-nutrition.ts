import { toNullableNumber, toNumber } from "@/lib/ai/parse-review-numbers";
import type { ReviewAverages, ReviewBrief, ReviewDayRow } from "@/lib/ai/types";
import type { Macros } from "@/lib/nutrition";
import { isRecord } from "@/lib/read";

export function parseAverages(value: unknown): ReviewAverages | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    count: toNumber(value.count),
    fact: parseMacros(value.fact),
    target: parseMacros(value.target),
  };
}

function parseMacros(value: unknown): Macros {
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

export function parseDayRow(row: Record<string, unknown>): ReviewDayRow | null {
  if (typeof row.date !== "string") {
    return null;
  }

  return {
    date: row.date,
    training: row.training === true,
    protein: toNumber(row.protein),
    protein_target: toNumber(row.protein_target),
    carbs: toNumber(row.carbs),
    carbs_target: toNumber(row.carbs_target),
    kcal: toNumber(row.kcal),
    kcal_target: toNumber(row.kcal_target),
    weight: toNullableNumber(row.weight),
  };
}

export function parseWeight(
  value: unknown,
): ReviewBrief["nutrition"]["weight"] {
  if (!isRecord(value)) {
    return {
      logged: 0,
      start: null,
      end: null,
      delta: null,
      protein_per_kg: null,
      protein_per_kg_target: null,
    };
  }

  return {
    logged: toNumber(value.logged),
    start: toNullableNumber(value.start),
    end: toNullableNumber(value.end),
    delta: toNullableNumber(value.delta),
    protein_per_kg: toNullableNumber(value.protein_per_kg),
    protein_per_kg_target: toNullableNumber(value.protein_per_kg_target),
  };
}

export function parseFoodShare(
  row: Record<string, unknown>,
): ReviewBrief["nutrition"]["foods"][number] | null {
  if (typeof row.name !== "string") {
    return null;
  }

  return {
    name: row.name,
    protein: toNumber(row.protein),
    kcal: toNumber(row.kcal),
    grams: toNumber(row.grams),
  };
}
