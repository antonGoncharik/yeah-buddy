import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getDateForMeal(
  userId: string,
  mealId: string,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const meal = await supabase
    .from("meals")
    .select("day_id")
    .eq("id", mealId)
    .eq("user_id", userId)
    .maybeSingle();

  if (meal.error) {
    throw meal.error;
  }

  if (!meal.data) {
    return null;
  }

  const day = await supabase
    .from("days")
    .select("date")
    .eq("id", meal.data.day_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (day.error) {
    throw day.error;
  }

  if (!day.data) {
    return null;
  }

  return String(day.data.date).slice(0, 10);
}
