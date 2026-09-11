import { previousIsoDate, shiftIsoDate } from "@/lib/day/dates";
import { getDayByDate } from "@/lib/day/store";
import { filledMealTypes, isMealType } from "@/lib/nutrition";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CopyDayHint, MealType } from "@/lib/types";

const COPY_DAYS_WINDOW = 14;

export async function yesterdayCopyHint(
  userId: string,
  date: string,
): Promise<{ exists: boolean; mealTypes: MealType[] }> {
  const yesterday = await getDayByDate(userId, previousIsoDate(date));
  if (!yesterday) {
    return { exists: false, mealTypes: [] };
  }

  return {
    exists: true,
    mealTypes: filledMealTypes(yesterday.meals),
  };
}

export async function listCopyDays(
  userId: string,
  beforeDate: string,
): Promise<CopyDayHint[]> {
  const start = shiftIsoDate(beforeDate, -(COPY_DAYS_WINDOW - 1));
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
      date,
      meals (
        meal_type,
        meal_items (id)
      )
    `,
    )
    .eq("user_id", userId)
    .gte("date", start)
    .lt("date", beforeDate)
    .order("date", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).flatMap((row) => {
    const date = String(row.date).slice(0, 10);
    const meals = Array.isArray(row.meals) ? row.meals : [];
    const mealTypes = meals.flatMap((meal) => {
      if (!meal || typeof meal !== "object") {
        return [];
      }
      const record = meal as { meal_type?: unknown; meal_items?: unknown };
      if (!isMealType(record.meal_type)) {
        return [];
      }
      if (!Array.isArray(record.meal_items) || record.meal_items.length === 0) {
        return [];
      }
      return [record.meal_type];
    });
    if (mealTypes.length === 0) {
      return [];
    }
    return [{ date, mealTypes }];
  });
}
