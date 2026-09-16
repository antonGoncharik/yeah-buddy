import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExerciseTrack } from "@/lib/types";
import type { TrackWriteInput } from "@/lib/workout/slot-plan-schema";
import { mapExerciseTrack, shiftTrackByKg } from "@/lib/workout/track-line";

export async function listTracksByExercise(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, ExerciseTrack>> {
  const map = new Map<string, ExerciseTrack>();
  if (exerciseIds.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercise_tracks")
    .select("*")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const track = mapExerciseTrack(row as Record<string, unknown>);
    if (track.steps.length > 0) {
      map.set(track.exercise_id, track);
    }
  }

  return map;
}

export async function listTracksById(
  userId: string,
  trackIds: string[],
): Promise<Map<string, ExerciseTrack>> {
  const map = new Map<string, ExerciseTrack>();
  const ids = [...new Set(trackIds)];
  if (ids.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercise_tracks")
    .select("*")
    .eq("user_id", userId)
    .in("id", ids);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const track = mapExerciseTrack(row as Record<string, unknown>);
    map.set(track.id, track);
  }

  return map;
}

/** Creates or replaces the exercise's line. A new line starts from step 0. */
export async function saveExerciseTrack(
  userId: string,
  exerciseId: string,
  input: TrackWriteInput,
): Promise<ExerciseTrack> {
  const position = Math.min(input.position ?? 0, input.steps.length);
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("exercise_tracks")
    .upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
        steps: input.steps,
        position,
        name: input.name ?? null,
      },
      { onConflict: "user_id,exercise_id" },
    )
    .select("*")
    .single();

  if (saved.error || !saved.data) {
    throw saved.error ?? new Error("Track save failed");
  }

  return mapExerciseTrack(saved.data as Record<string, unknown>);
}

export async function deleteExerciseTrack(
  userId: string,
  exerciseId: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("exercise_tracks")
    .delete()
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId);

  if (deleted.error) {
    throw deleted.error;
  }
}

/**
 * Moves the line forward after a completed session. Idempotent: a session
 * planned at step N only ever pushes the position to N + 1, never further.
 */
export async function advanceTrack(
  userId: string,
  trackId: string,
  plannedStep: number,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const current = await supabase
    .from("exercise_tracks")
    .select("*")
    .eq("user_id", userId)
    .eq("id", trackId)
    .maybeSingle();

  if (current.error) {
    throw current.error;
  }
  if (!current.data) {
    return;
  }

  const track = mapExerciseTrack(current.data as Record<string, unknown>);
  const next = Math.min(plannedStep + 1, track.steps.length);
  if (next <= track.position) {
    return;
  }

  const updated = await supabase
    .from("exercise_tracks")
    .update({ position: next })
    .eq("user_id", userId)
    .eq("id", trackId);

  if (updated.error) {
    throw updated.error;
  }
}

/** Adds kilograms to every matching line. Current step stays current. */
export async function bumpTracksByKg(
  userId: string,
  exerciseIds: string[],
  kg: number,
): Promise<void> {
  if (!(kg > 0)) {
    return;
  }
  const tracks = await listTracksByExercise(userId, exerciseIds);
  if (tracks.size === 0) {
    return;
  }

  const supabase = createSupabaseServerClient();
  for (const track of tracks.values()) {
    const steps = shiftTrackByKg(track.steps, kg);
    if (steps.length === 0) {
      continue;
    }
    const updated = await supabase
      .from("exercise_tracks")
      .update({ steps })
      .eq("user_id", userId)
      .eq("id", track.id);

    if (updated.error) {
      throw updated.error;
    }
  }
}
