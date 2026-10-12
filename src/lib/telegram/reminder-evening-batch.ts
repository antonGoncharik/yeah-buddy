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
      .select(
        "user_id, date, is_training_day, fact_protein, fact_fat, fact_carbs, fact_kcal, target_protein, target_fat, target_carbs, target_kcal",
      )
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
    const key = factKey(userId, date);
    dayByKey.set(key, {
      isTrainingDay:
        row.is_training_day === true
          ? true
          : row.is_training_day === false
            ? false
            : null,
      snapshot: {
        protein: Number(row.fact_protein) || 0,
        fat: Number(row.fact_fat) || 0,
        carbs: Number(row.fact_carbs) || 0,
        kcal: Number(row.fact_kcal) || 0,
        targetProtein: Number(row.target_protein) || 0,
        targetFat: Number(row.target_fat) || 0,
        targetCarbs: Number(row.target_carbs) || 0,
        targetKcal: Number(row.target_kcal) || 0,
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
