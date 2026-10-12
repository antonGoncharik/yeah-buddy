import { DAY_HISTORY_SELECT } from "@/lib/day/history";
import { mapDayHistoryRow } from "@/lib/day/map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nextCircleName } from "@/lib/telegram/reminder-facts";
import type { WorkoutSession } from "@/lib/types";
import { parseWorkoutSession } from "@/lib/workout/map-rows";

export type EveningReminderFacts = {
  foodLogged: boolean;
  isTrainingDay: boolean | null;
  session: WorkoutSession | null;
  snapshot: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
    targetProtein: number;
    targetFat: number;
    targetCarbs: number;
    targetKcal: number;
  } | null;
  nextTemplateName: string | null;
};

function factKey(userId: string, date: string): string {
  return `${userId}:${date}`;
}

export async function loadEveningReminderFactsBatch(
  items: Array<{ userId: string; date: string }>,
): Promise<Map<string, EveningReminderFacts>> {
  const map = new Map<string, EveningReminderFacts>();
  if (items.length === 0) {
    return map;
  }

  const userIds = [...new Set(items.map((item) => item.userId))];
  const dates = [...new Set(items.map((item) => item.date))];

  const supabase = createSupabaseServerClient();
  const [daysResult, foodResult, sessionsResult] = await Promise.all([
    supabase
      .from("days")
      .select(`user_id, ${DAY_HISTORY_SELECT}`)
      .in("user_id", userIds)
      .in("date", dates),
    supabase
      .from("days")
      .select("user_id, date, meals!inner(meal_items!inner(id))")
      .in("user_id", userIds)
      .in("date", dates),
    supabase
      .from("workout_sessions")
      .select("*")
      .in("user_id", userIds)
      .in("session_date", dates)
      .order("created_at", { ascending: false }),
  ]);

  if (daysResult.error) {
    throw daysResult.error;
  }
  if (foodResult.error) {
    throw foodResult.error;
  }
  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  const foodLogged = new Set<string>();
  for (const row of foodResult.data ?? []) {
    const userId = typeof row.user_id === "string" ? row.user_id : null;
    const date =
      typeof row.date === "string" ? String(row.date).slice(0, 10) : null;
    if (userId && date) {
      foodLogged.add(factKey(userId, date));
    }
  }

  const dayByKey = new Map<
    string,
    {
      isTrainingDay: boolean | null;
      snapshot: EveningReminderFacts["snapshot"];
    }
  >();
  for (const row of daysResult.data ?? []) {
    const userId = typeof row.user_id === "string" ? row.user_id : null;
    const date =
      typeof row.date === "string" ? String(row.date).slice(0, 10) : null;
    if (!userId || !date) {
      continue;
    }
    const mapped = mapDayHistoryRow(row as Record<string, unknown>);
    const key = factKey(userId, date);
    dayByKey.set(key, {
      isTrainingDay:
        mapped.is_training_day === true
          ? true
          : mapped.is_training_day === false
            ? false
            : null,
      snapshot: {
        protein: mapped.fact_protein,
        fat: mapped.fact_fat,
        carbs: mapped.fact_carbs,
        kcal: mapped.fact_kcal,
        targetProtein: mapped.target_protein,
        targetFat: mapped.target_fat,
        targetCarbs: mapped.target_carbs,
        targetKcal: mapped.target_kcal,
      },
    });
  }

  const sessionByKey = new Map<string, WorkoutSession>();
  for (const row of sessionsResult.data ?? []) {
    const userId = typeof row.user_id === "string" ? row.user_id : null;
    const date =
      typeof row.session_date === "string"
        ? String(row.session_date).slice(0, 10)
        : null;
    if (!userId || !date) {
      continue;
    }
    const key = factKey(userId, date);
    if (sessionByKey.has(key)) {
      continue;
    }
    const session = parseWorkoutSession(row);
    if (session) {
      sessionByKey.set(key, session);
    }
  }

  const nextNames = new Map<string, string | null>();
  await Promise.all(
    userIds.map(async (userId) => {
      nextNames.set(userId, await nextCircleName(userId));
    }),
  );

  for (const item of items) {
    const key = factKey(item.userId, item.date);
    const day = dayByKey.get(key);
    map.set(key, {
      foodLogged: foodLogged.has(key),
      isTrainingDay: day?.isTrainingDay ?? null,
      session: sessionByKey.get(key) ?? null,
      snapshot: day?.snapshot ?? null,
      nextTemplateName: nextNames.get(item.userId) ?? null,
    });
  }

  return map;
}
