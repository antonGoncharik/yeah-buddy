import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkoutSet } from "@/lib/types";
import { mapWorkoutSet } from "@/lib/workout/map-session";

const PAGE = 1000;
const ID_CHUNK = 40;

export interface SessionExerciseWork {
  exercise_id: string;
  name: string;
  note: string | null;
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
  const sessionExercises = await selectInChunks(sessionIds, (chunk, from, to) =>
    supabase
      .from("session_exercises")
      .select("id, session_id, exercise_id, sort_order, note")
      .eq("user_id", userId)
      .in("session_id", chunk)
      .order("sort_order", { ascending: true })
      .range(from, to),
  );
  if (sessionExercises.length === 0) {
    return grouped;
  }

  const exerciseIds = [
    ...new Set(sessionExercises.map((row) => String(row.exercise_id))),
  ];
  const [names, setsByExercise] = await Promise.all([
    exerciseNamesById(userId, exerciseIds),
    listWorkSetsBySessionExercise(
      userId,
      sessionExercises.map((row) => String(row.id)),
    ),
  ]);

  const pending = new Map<
    string,
    Array<SessionExerciseWork & { sort: number }>
  >();
  for (const row of sessionExercises) {
    const sessionId = String(row.session_id);
    const exerciseId = String(row.exercise_id);
    const current = pending.get(sessionId) ?? [];
    current.push({
      exercise_id: exerciseId,
      name: names.get(exerciseId) ?? "упражнение",
      note: typeof row.note === "string" ? row.note : null,
      sets: setsByExercise.get(String(row.id)) ?? [],
      sort: Number(row.sort_order) || 0,
    });
    pending.set(sessionId, current);
  }

  for (const [sessionId, list] of pending) {
    list.sort((left, right) => left.sort - right.sort);
    grouped.set(
      sessionId,
      list.map(({ sort: _sort, ...item }) => item),
    );
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
  const rows = await selectInChunks(sessionExerciseIds, (chunk, from, to) =>
    supabase
      .from("workout_sets")
      .select("*")
      .eq("user_id", userId)
      .eq("set_type", "work")
      .in("session_exercise_id", chunk)
      .order("set_number", { ascending: true })
      .range(from, to),
  );

  for (const row of rows) {
    const set = mapWorkoutSet(row as Record<string, unknown>);
    const current = map.get(set.session_exercise_id) ?? [];
    current.push(set);
    map.set(set.session_exercise_id, current);
  }

  for (const sets of map.values()) {
    sets.sort((left, right) => left.set_number - right.set_number);
  }

  return map;
}

async function selectInChunks<T>(
  ids: string[],
  load: (
    chunk: string[],
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let index = 0; index < ids.length; index += ID_CHUNK) {
    const chunk = ids.slice(index, index + ID_CHUNK);
    for (let from = 0; ; from += PAGE) {
      const result = await load(chunk, from, from + PAGE - 1);
      if (result.error) {
        throw result.error;
      }
      const page = result.data ?? [];
      rows.push(...page);
      if (page.length < PAGE) {
        break;
      }
    }
  }
  return rows;
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
