import { isIsoDate } from "@/lib/day/dates";
import { toNumber } from "@/lib/read";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FoodShare = {
  name: string;
  protein: number;
  kcal: number;
  grams: number;
};

export async function listFoodSharesInRange(
  userId: string,
  start: string,
  end: string,
): Promise<FoodShare[]> {
  if (!isIsoDate(start) || !isIsoDate(end)) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
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

  const totals = new Map<string, FoodShare>();
  for (const row of result.data ?? []) {
    const meals = (row as { meals?: unknown }).meals;
    if (!Array.isArray(meals)) {
      continue;
    }
    for (const meal of meals) {
      if (!meal || typeof meal !== "object" || !("meal_items" in meal)) {
        continue;
      }
      const items = (meal as { meal_items: unknown }).meal_items;
      if (!Array.isArray(items)) {
        continue;
      }
      for (const item of items) {
        if (!item || typeof item !== "object") {
          continue;
        }
        const record = item as Record<string, unknown>;
        const name = String(record.name_snapshot ?? "").trim();
        if (name === "") {
          continue;
        }
        const current = totals.get(name) ?? {
          name,
          protein: 0,
          kcal: 0,
          grams: 0,
        };
        current.protein += toNumber(record.protein);
        current.kcal += toNumber(record.kcal);
        current.grams += toNumber(record.grams);
        totals.set(name, current);
      }
    }
  }

  return [...totals.values()]
    .sort((left, right) => {
      if (right.protein !== left.protein) {
        return right.protein - left.protein;
      }
      return left.name.localeCompare(right.name, "ru");
    })
    .slice(0, 8)
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
