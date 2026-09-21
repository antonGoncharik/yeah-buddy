import { isIsoDate } from "@/lib/day/dates";
import { toNumber } from "@/lib/read";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FoodShare = {
  name: string;
  protein: number;
  kcal: number;
  grams: number;
};

export type FoodShareSplit = {
  all: FoodShare[];
  rest: FoodShare[];
  training: FoodShare[];
};

const ALL_LIMIT = 12;
const SPLIT_LIMIT = 8;

export function shareSplit(
  rows: Array<{
    training: boolean;
    items: Array<{
      name: string;
      protein: number;
      kcal: number;
      grams: number;
    }>;
  }>,
): FoodShareSplit {
  const all = new Map<string, FoodShare>();
  const rest = new Map<string, FoodShare>();
  const training = new Map<string, FoodShare>();

  for (const row of rows) {
    const bucket = row.training ? training : rest;
    for (const item of row.items) {
      const name = item.name.trim();
      if (name === "") {
        continue;
      }
      addShare(all, name, item);
      addShare(bucket, name, item);
    }
  }

  return {
    all: topShares(all, ALL_LIMIT),
    rest: topShares(rest, SPLIT_LIMIT),
    training: topShares(training, SPLIT_LIMIT),
  };
}

export async function listFoodSharesInRange(
  userId: string,
  start: string,
  end: string,
): Promise<FoodShareSplit> {
  if (!isIsoDate(start) || !isIsoDate(end)) {
    return { all: [], rest: [], training: [] };
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
      is_training_day,
      meals (
        meal_items (
          name_snapshot,
          grams,
          protein,
          kcal
        )
      )
    `,
    )
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []).map((row) => {
    const record = row as { is_training_day?: unknown; meals?: unknown };
    return {
      training: record.is_training_day === true,
      items: mealItems(record.meals),
    };
  });

  return shareSplit(rows);
}

function mealItems(meals: unknown): Array<{
  name: string;
  protein: number;
  kcal: number;
  grams: number;
}> {
  if (!Array.isArray(meals)) {
    return [];
  }

  const items: Array<{
    name: string;
    protein: number;
    kcal: number;
    grams: number;
  }> = [];
  for (const meal of meals) {
    if (!meal || typeof meal !== "object" || !("meal_items" in meal)) {
      continue;
    }
    const raw = (meal as { meal_items: unknown }).meal_items;
    if (!Array.isArray(raw)) {
      continue;
    }
    for (const item of raw) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as Record<string, unknown>;
      items.push({
        name: String(record.name_snapshot ?? ""),
        protein: toNumber(record.protein),
        kcal: toNumber(record.kcal),
        grams: toNumber(record.grams),
      });
    }
  }

  return items;
}

function addShare(
  totals: Map<string, FoodShare>,
  name: string,
  item: { protein: number; kcal: number; grams: number },
): void {
  const current = totals.get(name) ?? {
    name,
    protein: 0,
    kcal: 0,
    grams: 0,
  };
  current.protein += item.protein;
  current.kcal += item.kcal;
  current.grams += item.grams;
  totals.set(name, current);
}

function topShares(totals: Map<string, FoodShare>, limit: number): FoodShare[] {
  return [...totals.values()]
    .sort((left, right) => {
      if (right.protein !== left.protein) {
        return right.protein - left.protein;
      }
      return left.name.localeCompare(right.name, "ru");
    })
    .slice(0, limit)
    .map((item) => ({
      name: item.name,
      protein: round1(item.protein),
      kcal: Math.round(item.kcal),
      grams: Math.round(item.grams),
    }));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
