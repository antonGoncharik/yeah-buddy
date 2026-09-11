import { getTargets } from "@/lib/day/create";
import { assertWritableDayDate, isPastDayDate } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { getDayByDate } from "@/lib/day/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayType } from "@/lib/types";

export async function setDayType(
  userId: string,
  dayId: string,
  dayType: DayType,
): Promise<DayWithMeals> {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("days")
    .select("date")
    .eq("id", dayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (!existing.data) {
    throw new Error("Day not found");
  }

  assertWritableDayDate(String(existing.data.date).slice(0, 10));

  const targets = await getTargets(userId, dayType);
  const updated = await supabase
    .from("days")
    .update({
      is_training_day: dayType === "training",
      target_protein: targets.protein,
      target_fat: targets.fat,
      target_carbs: targets.carbs,
    })
    .eq("id", dayId)
    .eq("user_id", userId)
    .select("date")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    throw new Error("Day not found");
  }

  const day = await getDayByDate(userId, String(updated.data.date));
  if (!day) {
    throw new Error("Day lookup failed");
  }

  return day;
}

export async function markDateAsTrainingIfExists(
  userId: string,
  date: string,
): Promise<void> {
  if (isPastDayDate(date)) {
    return;
  }

  const day = await getDayByDate(userId, date);
  if (!day || day.is_training_day) {
    return;
  }

  await setDayType(userId, day.id, "training");
}
