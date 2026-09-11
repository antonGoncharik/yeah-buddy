import { type DayWithMeals, mapDayWithMeals } from "@/lib/day/map";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getDayByDate(
  userId: string,
  date: string,
): Promise<DayWithMeals | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
      *,
      meals (
        *,
        meal_items (*)
      )
    `,
    )
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapDayWithMeals(result.data as Record<string, unknown>);
}

export async function dateHasDay(
  userId: string,
  date: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("date", date);

  if (result.error) {
    throw result.error;
  }

  return (result.count ?? 0) > 0;
}
