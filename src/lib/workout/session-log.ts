import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProgressPoint, WorkoutSession, WorkoutSet } from "@/lib/types";
import { toNullableNumber, toNumber } from "@/lib/workout/numbers";
import { formatWorkSummary } from "@/lib/workout/session-format";

export async function listSessionWorkSummaries(
  userId: string,
  sessions: WorkoutSession[],
): Promise<Map<string, string>> {
  const gymIds = sessions
    .filter((session) => session.kind === "gym")
    .map((session) => session.id);
  const summaries = new Map<string, string>();
  if (gymIds.length === 0) {
    return summaries;
  }

  const grouped = await loadWorkBySession(userId, gymIds);
  for (const [sessionId, exercises] of grouped) {
    const summary = formatWorkSummary(exercises);
    if (summary) {
      summaries.set(sessionId, summary);
    }
  }

  return summaries;
}

export async function listExerciseWorkPoints(
  userId: string,
): Promise<Map<string, ProgressPoint[]>> {
  const supabase = createSupabaseServerClient();
  const sessionsResult = await supabase
    .from("workout_sessions")
    .select("id, session_date, phase_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .eq("kind", "gym")
    .not("template_id", "is", null)
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (sessionsResult.error) {
    if (isMissingKindColumn(sessionsResult.error.message)) {
      return listExerciseWorkPointsWithoutKind(userId);
    }
    throw sessionsResult.error;
  }

  const sessions = sessionsResult.data ?? [];
  return pointsFromSessions(
    userId,
    sessions.map((row) => ({
      id: String(row.id),
      session_date: String(row.session_date).slice(0, 10),
    })),
  );
}

async function listExerciseWorkPointsWithoutKind(
  userId: string,
): Promise<Map<string, ProgressPoint[]>> {
  const supabase = createSupabaseServerClient();
  const sessionsResult = await supabase
    .from("workout_sessions")
    .select("id, session_date")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("template_id", "is", null)
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  return pointsFromSessions(
    userId,
    (sessionsResult.data ?? []).map((row) => ({
      id: String(row.id),
      session_date: String(row.session_date).slice(0, 10),
    })),
  );
}

async function pointsFromSessions(
  userId: string,
  sessions: Array<{ id: string; session_date: string }>,
): Promise<Map<string, ProgressPoint[]>> {
  const points = new Map<string, ProgressPoint[]>();
  if (sessions.length === 0) {
    return points;
  }

  const dateBySession = new Map(
    sessions.map((session) => [session.id, session.session_date]),
  );
  const grouped = await loadWorkBySession(
    userId,
    sessions.map((session) => session.id),
  );

  for (const [sessionId, exercises] of grouped) {
    const date = dateBySession.get(sessionId);
    if (!date) {
      continue;
    }

    for (const item of exercises) {
      const work = item.sets[0];
      const weight = work?.actual_weight ?? work?.planned_weight;
      if (work == null || weight == null || weight <= 0) {
        continue;
      }

      const list = points.get(item.exercise_id) ?? [];
      list.push({
        date,
        weight,
        phase_type: null,
        macro_number: null,
        label: formatWorkDate(date),
      });
      points.set(item.exercise_id, list);
    }
  }

  return points;
}

async function loadWorkBySession(
  userId: string,
  sessionIds: string[],
): Promise<
  Map<string, Array<{ exercise_id: string; name: string; sets: WorkoutSet[] }>>
> {
  const grouped = new Map<
    string,
    Array<{ exercise_id: string; name: string; sets: WorkoutSet[] }>
  >();
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

function formatWorkDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMM", { locale: ru });
  } catch {
    return isoDate;
  }
}

function isMissingKindColumn(message: string): boolean {
  return message.includes("kind") && message.includes("does not exist");
}
