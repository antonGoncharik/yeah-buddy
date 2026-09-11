import { isIsoDate } from "@/lib/day/dates";
import { mapDayHistoryRow } from "@/lib/day/map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DayHistoryRow } from "@/lib/types";

const DAY_HISTORY_SELECT = `
  date,
  is_training_day,
  target_protein,
  target_fat,
  target_carbs,
  target_kcal,
  body_weight,
  meals (
    meal_items (
      protein,
      fat,
      carbs,
      kcal
    )
  )
`;

export async function listDayHistory(
  userId: string,
  options: { before?: string; limit: number },
): Promise<{ items: DayHistoryRow[]; next_before: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 50);
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("days")
    .select(DAY_HISTORY_SELECT)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit + 1);

  if (options.before && isIsoDate(options.before)) {
    query = query.lt("date", options.before);
  }

  const result = await query;
  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []).map((row) =>
    mapDayHistoryRow(row as Record<string, unknown>),
  );
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    next_before: hasMore ? (items.at(-1)?.date ?? null) : null,
  };
}

export async function listDaysInRange(
  userId: string,
  start: string,
  end: string,
): Promise<DayHistoryRow[]> {
  if (!isIsoDate(start) || !isIsoDate(end)) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(DAY_HISTORY_SELECT)
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) =>
    mapDayHistoryRow(row as Record<string, unknown>),
  );
}
