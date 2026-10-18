import { isIsoDate } from "@/lib/day/dates";
import { isMealType, MEAL_DISPLAY_ORDER } from "@/lib/nutrition";
import { toNumber } from "@/lib/read";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealType } from "@/lib/types";

export type FoodShare = {
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  grams: number;
};

/** Average plate of one meal across logged days of that type. */
export type MealPlate = {
  meal: MealType;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
};

export type FoodShareSplit = {
  all: FoodShare[];
  rest: FoodShare[];
  training: FoodShare[];
  mealsRest: MealPlate[];
  mealsTraining: MealPlate[];
};

type ShareItem = {
  meal: MealType;
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  grams: number;
};

type MacroSum = {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
};

const ALL_LIMIT = 12;
const SPLIT_LIMIT = 8;

export function shareSplit(
  rows: Array<{
    training: boolean;
    items: ShareItem[];
  }>,
): FoodShareSplit {
  const all = new Map<string, FoodShare>();
  const rest = new Map<string, FoodShare>();
  const training = new Map<string, FoodShare>();
  const restMeals = new Map<MealType, MacroSum>();
  const trainingMeals = new Map<MealType, MacroSum>();
  let restDays = 0;
  let trainingDays = 0;

  for (const row of rows) {
    const foods = row.training ? training : rest;
    const meals = row.training ? trainingMeals : restMeals;
    if (row.training) {
      trainingDays += 1;
    } else {
      restDays += 1;
    }
    for (const item of row.items) {
      addMeal(meals, item);
      const name = item.name.trim();
      if (name === "") {
        continue;
      }
      addShare(all, name, item);
      addShare(foods, name, item);
    }
  }

  return {
    all: topShares(all, ALL_LIMIT),
    rest: topShares(rest, SPLIT_LIMIT),
    training: topShares(training, SPLIT_LIMIT),
    mealsRest: mealPlates(restMeals, restDays),
    mealsTraining: mealPlates(trainingMeals, trainingDays),
  };
}

export async function listFoodSharesInRange(
  userId: string,
  start: string,
  end: string,
): Promise<FoodShareSplit> {
  if (!isIsoDate(start) || !isIsoDate(end)) {
    return {
      all: [],
      rest: [],
      training: [],
      mealsRest: [],
      mealsTraining: [],
    };
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
      is_training_day,
      meals (
        meal_type,
        meal_items (
          name_snapshot,
          grams,
          protein,
          fat,
          carbs,
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

function mealItems(meals: unknown): ShareItem[] {
  if (!Array.isArray(meals)) {
    return [];
  }

  const items: ShareItem[] = [];
  for (const meal of meals) {
    if (!meal || typeof meal !== "object" || !("meal_items" in meal)) {
      continue;
    }
    const mealRecord = meal as { meal_type?: unknown; meal_items: unknown };
    if (!isMealType(mealRecord.meal_type)) {
      continue;
    }
    const raw = mealRecord.meal_items;
    if (!Array.isArray(raw)) {
      continue;
    }
    for (const item of raw) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as Record<string, unknown>;
      items.push({
        meal: mealRecord.meal_type,
        name: String(record.name_snapshot ?? ""),
        protein: toNumber(record.protein),
        fat: toNumber(record.fat),
        carbs: toNumber(record.carbs),
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
  item: ShareItem,
): void {
  const current = totals.get(name) ?? {
    name,
    protein: 0,
    fat: 0,
    carbs: 0,
    kcal: 0,
    grams: 0,
  };
  current.protein += item.protein;
  current.fat += item.fat;
  current.carbs += item.carbs;
  current.kcal += item.kcal;
  current.grams += item.grams;
  totals.set(name, current);
}

function addMeal(totals: Map<MealType, MacroSum>, item: ShareItem): void {
  const current = totals.get(item.meal) ?? {
    protein: 0,
    fat: 0,
    carbs: 0,
    kcal: 0,
  };
  current.protein += item.protein;
  current.fat += item.fat;
  current.carbs += item.carbs;
  current.kcal += item.kcal;
  totals.set(item.meal, current);
}

function mealPlates(
  totals: Map<MealType, MacroSum>,
  days: number,
): MealPlate[] {
  if (days <= 0) {
    return [];
  }
  const plates: MealPlate[] = [];
  for (const meal of MEAL_DISPLAY_ORDER) {
    const sum = totals.get(meal);
    if (!sum) {
      continue;
    }
    const plate: MealPlate = {
      meal,
      protein: round1(sum.protein / days),
      fat: round1(sum.fat / days),
      carbs: round1(sum.carbs / days),
      kcal: Math.round(sum.kcal / days),
    };
    if (
      plate.protein === 0 &&
      plate.fat === 0 &&
      plate.carbs === 0 &&
      plate.kcal === 0
    ) {
      continue;
    }
    plates.push(plate);
  }
  return plates;
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
      fat: round1(item.fat),
      carbs: round1(item.carbs),
      kcal: Math.round(item.kcal),
      grams: Math.round(item.grams),
    }));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
