import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Exercise,
  SessionDetail,
  WorkoutPhase,
  WorkoutSession,
  WorkoutSet,
} from "@/lib/types";
import { mapExercise } from "@/lib/workout/exercises";
import {
  mapSessionExercise,
  mapWorkoutPhase,
  mapWorkoutSet,
} from "@/lib/workout/map-rows";
import { loadPreviousWork } from "@/lib/workout/session-memory-load";
import { getTemplate } from "@/lib/workout/templates";

export async function loadSessionDetail(
  userId: string,
  session: WorkoutSession,
): Promise<SessionDetail> {
  const supabase = createSupabaseServerClient();
  const phase = session.phase_id
    ? await getPhase(userId, session.phase_id)
    : null;
  const template = session.template_id
    ? await getTemplate(userId, session.template_id)
    : null;
  const exerciseRows = await supabase
    .from("session_exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("session_id", session.id)
    .order("sort_order", { ascending: true });

  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const sessionExercises = (exerciseRows.data ?? []).map((row) =>
    mapSessionExercise(row as Record<string, unknown>),
  );
  const exerciseIds = sessionExercises.map((item) => item.exercise_id);
  const [exercisesById, setsByExercise, previousByExercise] = await Promise.all(
    [
      mapExercisesById(userId, exerciseIds),
      listSetsBySessionExercises(
        userId,
        sessionExercises.map((item) => item.id),
      ),
      loadPreviousWork(userId, session, exerciseIds),
    ],
  );

  return {
    session,
    template,
    phase,
    exercises: sessionExercises.flatMap((item) => {
      const exercise = exercisesById.get(item.exercise_id);
      if (!exercise) {
        return [];
      }

      return [
        {
          ...item,
          exercise,
          sets: setsByExercise.get(item.id) ?? [],
          previous: previousByExercise.get(item.exercise_id) ?? null,
        },
      ];
    }),
    raise_offers: [],
  };
}

export async function getPhase(
  userId: string,
  phaseId: string | null,
): Promise<WorkoutPhase | null> {
  if (!phaseId) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("id", phaseId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapWorkoutPhase(result.data as Record<string, unknown>);
}

async function mapExercisesById(userId: string, ids: string[]) {
  const map = new Map<string, Exercise>();
  if (ids.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .in("id", ids);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const exercise = mapExercise(row as Record<string, unknown>);
    map.set(exercise.id, exercise);
  }

  return map;
}

async function listSetsBySessionExercises(userId: string, ids: string[]) {
  const map = new Map<string, WorkoutSet[]>();
  if (ids.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", userId)
    .in("session_exercise_id", ids)
    .order("set_number", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const set = mapWorkoutSet(row as Record<string, unknown>);
    const current = map.get(set.session_exercise_id) ?? [];
    current.push(set);
    map.set(set.session_exercise_id, current);
  }

  return map;
}
