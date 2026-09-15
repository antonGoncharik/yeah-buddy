import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toNullableNumber } from "@/lib/workout/numbers";

const RECENT_SESSIONS = 40;

/**
 * Last weight actually lifted per exercise, across any template — the
 * starting point for «по самочувствию» slots.
 */
export async function loadLastWorkWeights(
  userId: string,
  exerciseIds: string[],
  beforeSessionId: string | null = null,
): Promise<Map<string, number>> {
  const found = new Map<string, number>();
  if (exerciseIds.length === 0) {
    return found;
  }

  const supabase = createSupabaseServerClient();
  let sessionsQuery = supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(RECENT_SESSIONS);
  if (beforeSessionId) {
    sessionsQuery = sessionsQuery.neq("id", beforeSessionId);
  }
  const sessions = await sessionsQuery;
  if (sessions.error) {
    throw sessions.error;
  }

  const sessionIds = (sessions.data ?? []).map((row) => String(row.id));
  if (sessionIds.length === 0) {
    return found;
  }
  const rank = new Map(sessionIds.map((id, index) => [id, index] as const));

  const exerciseRows = await supabase
    .from("session_exercises")
    .select("id, session_id, exercise_id")
    .eq("user_id", userId)
    .in("session_id", sessionIds)
    .in("exercise_id", exerciseIds);
  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const rows = (exerciseRows.data ?? []).map((row) => ({
    id: String(row.id),
    exercise_id: String(row.exercise_id),
    rank: rank.get(String(row.session_id)) ?? Number.MAX_SAFE_INTEGER,
  }));
  if (rows.length === 0) {
    return found;
  }

  const sets = await supabase
    .from("workout_sets")
    .select("session_exercise_id, actual_weight, planned_weight, set_number")
    .eq("user_id", userId)
    .eq("set_type", "work")
    .eq("is_completed", true)
    .in(
      "session_exercise_id",
      rows.map((row) => row.id),
    )
    .order("set_number", { ascending: true });
  if (sets.error) {
    throw sets.error;
  }

  const weightBySessionExercise = new Map<string, number>();
  for (const row of sets.data ?? []) {
    const key = String(row.session_exercise_id);
    if (weightBySessionExercise.has(key)) {
      continue;
    }
    const weight =
      toNullableNumber(row.actual_weight) ??
      toNullableNumber(row.planned_weight);
    if (weight != null && weight > 0) {
      weightBySessionExercise.set(key, weight);
    }
  }

  const bestRank = new Map<string, number>();
  for (const row of rows) {
    const weight = weightBySessionExercise.get(row.id);
    if (weight == null) {
      continue;
    }
    const current = bestRank.get(row.exercise_id);
    if (current == null || row.rank < current) {
      bestRank.set(row.exercise_id, row.rank);
      found.set(row.exercise_id, weight);
    }
  }

  return found;
}
