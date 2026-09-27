import { coachGymReport, proteinLeftShort } from "@/lib/coach/report";
import { requireBoardGrant } from "@/lib/coach/store";
import type { CoachBoard, CoachDay, CoachMeal } from "@/lib/coach/types";
import { isIsoDate } from "@/lib/day/dates";
import { weekDates, weekWindow } from "@/lib/day/week";
import { getUserCalendarToday } from "@/lib/day/writable";
import { getMealLabel, isMealType, MEAL_DISPLAY_ORDER } from "@/lib/nutrition";
import { isRecord, toNullableNumber, toNumber } from "@/lib/read";
import { loadOwnerName } from "@/lib/share/pack-load";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MealType, SessionStatus } from "@/lib/types";
import { mapWorkoutSession } from "@/lib/workout/map-session";
import { loadWorkBySession } from "@/lib/workout/session-log-load";
import { templateNamesById } from "@/lib/workout/session-names";

const ATHLETE_FALLBACK = "Подопечный";
const GYM_TITLE = "Тренировка";

interface FoodDay {
  date: string;
  training: boolean;
  caught_up: boolean;
  target_protein: number;
  target_kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  body_weight: number | null;
  meals: CoachMeal[];
}

export async function loadCoachBoard(
  viewerId: string,
  grantId: string,
): Promise<CoachBoard> {
  const grant = await requireBoardGrant(viewerId, grantId);
  const athleteId = grant.athlete_user_id;
  const today = await getUserCalendarToday(athleteId);
  const { start, end } = weekWindow(today);

  const [foodDays, sessions, weight, name] = await Promise.all([
    listFoodDays(athleteId, start, end),
    listSessions(athleteId, start, end),
    latestWeight(athleteId, today),
    loadOwnerName(athleteId),
  ]);

  const picked = pickSessions(sessions);
  const [names, work] = await Promise.all([
    templateNamesById(
      athleteId,
      picked.flatMap((session) =>
        session.template_id ? [session.template_id] : [],
      ),
    ),
    loadWorkBySession(
      athleteId,
      picked.map((session) => session.id),
    ),
  ]);

  const foodByDate = new Map(foodDays.map((day) => [day.date, day]));
  const sessionByDate = new Map(
    picked.map((session) => [session.session_date, session]),
  );

  const days = weekDates(today).map((date) => {
    const food = foodByDate.get(date) ?? null;
    const session = sessionByDate.get(date) ?? null;
    const title = session
      ? (session.template_id ? names.get(session.template_id) : null) ||
        GYM_TITLE
      : "";
    const gym = coachGymReport({
      status: session?.status ?? "none",
      date,
      today,
      exercises: session ? (work.get(session.id) ?? []) : [],
    });

    const day: CoachDay = {
      date,
      training: food?.training === true || session != null,
      caught_up: food?.caught_up === true,
      target_protein: food?.target_protein ?? 0,
      target_kcal: food?.target_kcal ?? 0,
      protein: food?.protein ?? 0,
      fat: food?.fat ?? 0,
      carbs: food?.carbs ?? 0,
      kcal: food?.kcal ?? 0,
      body_weight: food?.body_weight ?? null,
      protein_short: proteinLeftShort(
        food?.protein ?? 0,
        food?.target_protein ?? 0,
      ),
      meals: food?.meals ?? [],
      gym: {
        tone: gym.tone,
        title,
        headline: gym.headline,
        lines: gym.lines,
      },
    };
    return day;
  });

  return {
    id: grant.id,
    athlete_name: name?.trim() || ATHLETE_FALLBACK,
    expires_at: grant.expires_at,
    today,
    weight,
    days,
  };
}

async function listFoodDays(
  userId: string,
  start: string,
  end: string,
): Promise<FoodDay[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select(
      `
      date,
      is_training_day,
      target_protein,
      target_kcal,
      body_weight,
      caught_up,
      meals (
        meal_type,
        sort_order,
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

  return (result.data ?? [])
    .map((row) => mapFoodDay(row as Record<string, unknown>))
    .filter((day): day is FoodDay => day != null);
}

async function listSessions(userId: string, start: string, end: string) {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["completed", "planned", "skipped"])
    .gte("session_date", start)
    .lte("session_date", end)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? [])
    .map((row) => mapWorkoutSession(row as Record<string, unknown>))
    .filter(
      (session) =>
        isIsoDate(session.session_date) &&
        session.session_date >= start &&
        session.session_date <= end,
    );
}

function pickSessions(
  sessions: Awaited<ReturnType<typeof listSessions>>,
): Awaited<ReturnType<typeof listSessions>> {
  const picked = new Map<string, (typeof sessions)[number]>();
  for (const session of sessions) {
    const current = picked.get(session.session_date);
    if (!current || sessionRank(session.status) < sessionRank(current.status)) {
      picked.set(session.session_date, session);
    }
  }
  return [...picked.values()];
}

function sessionRank(status: SessionStatus): number {
  if (status === "completed") {
    return 0;
  }
  if (status === "skipped") {
    return 1;
  }
  return 2;
}

async function latestWeight(
  userId: string,
  today: string,
): Promise<CoachBoard["weight"]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("date, body_weight")
    .eq("user_id", userId)
    .not("body_weight", "is", null)
    .lte("date", today)
    .order("date", { ascending: false })
    .limit(8);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    if (!isRecord(row) || typeof row.date !== "string") {
      continue;
    }
    const date = row.date.slice(0, 10);
    const kg = toNullableNumber(row.body_weight);
    if (!isIsoDate(date) || kg == null || kg <= 0) {
      continue;
    }
    return { kg, date };
  }

  return null;
}

function mapFoodDay(row: Record<string, unknown>): FoodDay | null {
  const date = typeof row.date === "string" ? row.date.slice(0, 10) : "";
  if (!isIsoDate(date)) {
    return null;
  }

  const meals: Array<CoachMeal & { meal_type: MealType }> = [];
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let kcal = 0;

  if (Array.isArray(row.meals)) {
    for (const meal of row.meals) {
      if (!isRecord(meal) || !isMealType(meal.meal_type)) {
        continue;
      }
      const items = mapMealLines(meal.meal_items);
      for (const item of items) {
        protein += item.protein;
        fat += item.fat;
        carbs += item.carbs;
        kcal += item.kcal;
      }
      const visible = items.filter((item) => item.name !== "");
      if (visible.length === 0) {
        continue;
      }
      meals.push({
        meal_type: meal.meal_type,
        label: getMealLabel(meal.meal_type),
        items: visible.map((item) => ({
          name: item.name,
          grams: item.grams,
          protein: item.protein,
          kcal: item.kcal,
        })),
      });
    }
  }

  meals.sort(
    (left, right) =>
      MEAL_DISPLAY_ORDER.indexOf(left.meal_type) -
      MEAL_DISPLAY_ORDER.indexOf(right.meal_type),
  );

  const bodyWeight = toNullableNumber(row.body_weight);

  return {
    date,
    training: row.is_training_day === true,
    caught_up: row.caught_up === true,
    target_protein: toNumber(row.target_protein),
    target_kcal: toNumber(row.target_kcal),
    protein,
    fat,
    carbs,
    kcal,
    body_weight: bodyWeight != null && bodyWeight > 0 ? bodyWeight : null,
    meals: meals.map(({ label, items }) => ({ label, items })),
  };
}

function mapMealLines(value: unknown): Array<{
  name: string;
  grams: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
}> {
  if (!Array.isArray(value)) {
    return [];
  }

  const lines = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const grams = toNumber(item.grams);
    if (!(grams > 0)) {
      continue;
    }
    lines.push({
      name:
        typeof item.name_snapshot === "string" ? item.name_snapshot.trim() : "",
      grams,
      protein: toNumber(item.protein),
      fat: toNumber(item.fat),
      carbs: toNumber(item.carbs),
      kcal: toNumber(item.kcal),
    });
  }
  return lines;
}
