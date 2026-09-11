import { parseBodyWeight } from "@/lib/day/body-weight";
import { assertWritableDayDate, isIsoDate } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { getDayByDate } from "@/lib/day/store";
import { CHECK_FIELDS } from "@/lib/messages";
import { toNullableNumber } from "@/lib/read";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getLastBodyWeight(
  userId: string,
  beforeDate: string,
): Promise<number | null> {
  if (!isIsoDate(beforeDate)) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("body_weight")
    .eq("user_id", userId)
    .not("body_weight", "is", null)
    .lt("date", beforeDate)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return toNullableNumber(result.data?.body_weight);
}

export async function listBodyWeights(
  userId: string,
): Promise<Array<{ date: string; weight: number }>> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("date, body_weight")
    .eq("user_id", userId)
    .not("body_weight", "is", null)
    .order("date", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).flatMap((row) => {
    const date = String(row.date).slice(0, 10);
    const weight = toNullableNumber(row.body_weight);
    if (!isIsoDate(date) || weight == null) {
      return [];
    }
    return [{ date, weight }];
  });
}

export async function setBodyWeight(
  userId: string,
  dayId: string,
  bodyWeight: number | null,
): Promise<DayWithMeals> {
  const rounded = bodyWeight == null ? null : parseBodyWeight(bodyWeight);
  if (bodyWeight != null && rounded == null) {
    throw new Error(CHECK_FIELDS);
  }

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

  const updated = await supabase
    .from("days")
    .update({ body_weight: rounded })
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
