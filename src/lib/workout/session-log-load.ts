import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkoutSet } from "@/lib/types";
import { toNullableNumber, toNumber } from "@/lib/workout/numbers";

export interface SessionExerciseWork {
  exercise_id: string;
  name: string;
  sets: WorkoutSet[];
}

export async function loadWorkBySession(
  userId: string,
  sessionIds: string[],
): Promise<Map<string, SessionExerciseWork[]>> {
  const grouped = new Map<string, SessionExerciseWork[]>();
  if (sessionIds.length === 0) {
    return grouped;
  }

  const supabase = createSupabaseServerClient();
  const exerciseRows = await supabase
    .from("session_exercises")
    .select("id, session_id, exercise_id, sort_order")
    .eq("user_id", userId)
    .in("session_id", sessionIds)
    .order("sort_order", { ascending: true });

  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const sessionExercises = exerciseRows.data ?? [];
  if (sessionExercises.length === 0) {
    return grouped;
  }

  const exerciseIds = [
    ...new Set(sessionExercises.map((row) => String(row.exercise_id))),
  ];
  const names = await exerciseNamesById(userId, exerciseIds);
  const setsByExercise = await listWorkSetsBySessionExercise(
    userId,
    sessionExercises.map((row) => String(row.id)),
  );

  for (const row of sessionExercises) {
    const sessionId = String(row.session_id);
    const exerciseId = String(row.exercise_id);
    const current = grouped.get(sessionId) ?? [];
    current.push({
      exercise_id: exerciseId,
      name: names.get(exerciseId) ?? "упражнение",
      sets: setsByExercise.get(String(row.id)) ?? [],
    });
    grouped.set(sessionId, current);
  }

  return grouped;
}

async function listWorkSetsBySessionExercise(
  userId: string,
  sessionExerciseIds: string[],
): Promise<Map<string, WorkoutSet[]>> {
  const map = new Map<string, WorkoutSet[]>();
  if (sessionExerciseIds.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("set_type", "work")
    .in("session_exercise_id", sessionExerciseIds)
    .order("set_number", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const set = mapWorkSet(row as Record<string, unknown>);
    const current = map.get(set.session_exercise_id) ?? [];
    current.push(set);
    map.set(set.session_exercise_id, current);
  }

  return map;
}

async function exerciseNamesById(userId: string, ids: string[]) {
  const names = new Map<string, string>();
  if (ids.length === 0) {
    return names;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("id, name, short_name")
    .eq("user_id", userId)
    .in("id", ids);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const name =
      typeof row.short_name === "string" && row.short_name.trim() !== ""
        ? row.short_name
        : String(row.name);
    names.set(String(row.id), name);
  }

  return names;
}

function mapWorkSet(row: Record<string, unknown>): WorkoutSet {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_exercise_id: String(row.session_exercise_id),
    set_type: "work",
    set_number: toNumber(row.set_number),
    planned_weight: toNullableNumber(row.planned_weight),
    planned_reps: toNullableNumber(row.planned_reps),
    planned_seconds: toNullableNumber(row.planned_seconds),
    actual_weight: toNullableNumber(row.actual_weight),
    actual_reps: toNullableNumber(row.actual_reps),
    actual_seconds: toNullableNumber(row.actual_seconds),
    is_completed: Boolean(row.is_completed),
    created_at: String(row.created_at),
  };
}
