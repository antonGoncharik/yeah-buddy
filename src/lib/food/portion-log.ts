import { type PortionChip, portionChips } from "@/lib/food/portions";
import { getFood } from "@/lib/food/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listPortionChips(
  userId: string,
  foodId: string,
  today: string,
): Promise<PortionChip[] | null> {
  const food = await getFood(userId, foodId);
  if (!food) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("meal_items")
    .select("grams, created_at, meals!inner(days!inner(date))")
    .eq("user_id", userId)
    .eq("food_id", foodId)
    .order("created_at", { ascending: false })
    .limit(24);

  if (result.error) {
    throw result.error;
  }

  const logs = (result.data ?? []).flatMap((row) => {
    const grams = Number(row.grams);
    const date = readDate(row.meals);
    if (!(grams > 0) || !date) {
      return [];
    }
    return [{ date, grams }];
  });

  return portionChips({
    logs,
    today,
    pieceGrams: food.default_portion_g,
    pieceLabel: food.default_portion_label,
  });
}

function readDate(meals: unknown): string | null {
  const meal = Array.isArray(meals) ? meals[0] : meals;
  if (typeof meal !== "object" || meal == null) {
    return null;
  }
  const days = "days" in meal ? meal.days : null;
  const day = Array.isArray(days) ? days[0] : days;
  if (typeof day !== "object" || day == null || !("date" in day)) {
    return null;
  }
  return typeof day.date === "string" ? day.date.slice(0, 10) : null;
}
