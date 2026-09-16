import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Exercise,
  SessionDetail,
  SessionExercise,
  SessionTrackInfo,
  WorkoutPhase,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { listTracksById } from "@/lib/workout/exercise-tracks";
import { listExercises, mapExercise } from "@/lib/workout/exercises";
import {
  templateMissingMaxes,
  templateMissingTracks,
} from "@/lib/workout/hints";
import { exerciseShortLabel } from "@/lib/workout/labels";
import {
  mapSessionExercise,
  mapWorkoutPhase,
  mapWorkoutSet,
} from "@/lib/workout/map-rows";
import { loadPreviousWork } from "@/lib/workout/session-memory-load";
import { getTemplate } from "@/lib/workout/templates";
import { trackWeightAt } from "@/lib/workout/track-line";

export async function loadSessionDetail(
  userId: string,
  session: WorkoutSession,
): Promise<SessionDetail> {
  const supabase = createSupabaseServerClient();
  const [phase, template, exerciseRows] = await Promise.all([
    session.phase_id ? getPhase(userId, session.phase_id) : null,
    session.template_id ? getTemplate(userId, session.template_id) : null,
    supabase
      .from("session_exercises")
      .select("*")
      .eq("user_id", userId)
      .eq("session_id", session.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const sessionExercises = (exerciseRows.data ?? []).map((row) =>
    mapSessionExercise(row as Record<string, unknown>),
  );
  const exerciseIds = sessionExercises.map((item) => item.exercise_id);
  const [exercisesById, setsByExercise, previousByExercise, missing, tracks] =
    await Promise.all([
      mapExercisesById(userId, exerciseIds),
      listSetsBySessionExercises(
        userId,
        sessionExercises.map((item) => item.id),
      ),
      loadPreviousWork(userId, session, exerciseIds),
      listMissing(
        userId,
        session,
        template,
        exerciseIds,
        phase?.phase_type ?? null,
      ),
      listTrackInfo(userId, sessionExercises),
    ]);

  return {
    session,
    template,
    phase,
    missing_maxes: missing.maxes,
    missing_tracks: missing.tracks,
    tracks: tracks.flatMap((info) => {
      const exercise = exercisesById.get(info.exercise_id);
      return exercise
        ? [
            {
              ...info,
              name: exerciseShortLabel(exercise.short_name, exercise.name),
            },
          ]
        : [];
    }),
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

async function listMissing(
  userId: string,
  session: WorkoutSession,
  template: WorkoutTemplateDetail | null,
  plannedExerciseIds: string[],
  phaseKey: string | null,
): Promise<{ maxes: Exercise[]; tracks: Exercise[] }> {
  if (session.status !== "planned" || !template) {
    return { maxes: [], tracks: [] };
  }

  // Cheap pre-check with an empty catalog: no candidates → no query.
  const maxCandidates = templateMissingMaxes(
    template,
    [],
    plannedExerciseIds,
    phaseKey,
  );
  const trackCandidates = templateMissingTracks(
    template,
    [],
    plannedExerciseIds,
    phaseKey,
  );
  if (maxCandidates.length === 0 && trackCandidates.length === 0) {
    return { maxes: [], tracks: [] };
  }

  const catalog = await listExercises(userId, "active");
  return {
    maxes: templateMissingMaxes(
      template,
      catalog,
      plannedExerciseIds,
      phaseKey,
    ),
    tracks: templateMissingTracks(
      template,
      catalog,
      plannedExerciseIds,
      phaseKey,
    ),
  };
}

async function listTrackInfo(
  userId: string,
  sessionExercises: SessionExercise[],
): Promise<SessionTrackInfo[]> {
  const tracked = sessionExercises.filter(
    (item) => item.track_id != null && item.track_step != null,
  );
  if (tracked.length === 0) {
    return [];
  }

  const tracks = await listTracksById(
    userId,
    tracked.flatMap((item) => (item.track_id ? [item.track_id] : [])),
  );

  return tracked.flatMap((item) => {
    const track = item.track_id ? tracks.get(item.track_id) : null;
    const step = item.track_step;
    if (!track || step == null || track.steps.length === 0) {
      return [];
    }
    const total = track.steps.length;
    const finished = step + 1 >= total;
    return [
      {
        exercise_id: item.exercise_id,
        name: "",
        step: Math.min(step + 1, total),
        total,
        weight: trackWeightAt(track, step),
        next_weight: finished ? null : trackWeightAt(track, step + 1),
        finished,
      },
    ];
  });
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
