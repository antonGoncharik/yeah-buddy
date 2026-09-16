import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExerciseTrack } from "@/lib/types";
import type { TrackWriteInput } from "@/lib/workout/slot-plan-schema";
import {
  asWorkingKg,
  mapExerciseTrack,
  shiftWorkingKg,
  trackCurrentWeight,
} from "@/lib/workout/track-line";

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

/** Creates or replaces the exercise's working kilograms. */
export async function saveExerciseTrack(
  userId: string,
  exerciseId: string,
  input: TrackWriteInput,
): Promise<ExerciseTrack> {
  const kg = workingKgFromWrite(input);
  if (kg == null) {
    throw new Error("Нужен рабочий вес.");
  }
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("exercise_tracks")
    .upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
        steps: asWorkingKg(kg),
        position: 0,
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

/** Adds kilograms to the working weight. Leftover ladder steps collapse. */
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
    const steps = shiftWorkingKg(track, kg);
    if (steps.length === 0) {
      continue;
    }
    const updated = await supabase
      .from("exercise_tracks")
      .update({ steps, position: 0 })
      .eq("user_id", userId)
      .eq("id", track.id);

    if (updated.error) {
      throw updated.error;
    }
  }
}

function workingKgFromWrite(input: TrackWriteInput): number | null {
  if (input.weight != null && input.weight > 0) {
    return input.weight;
  }
  if (input.steps && input.steps.length > 0) {
    return trackCurrentWeight({
      steps: input.steps,
      position: input.position ?? 0,
    });
  }
  return null;
}
