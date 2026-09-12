import { getUserCalendarToday } from "@/lib/day/writable";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PhaseMax, PhaseMaxRow, WorkoutPhase } from "@/lib/types";
import { listExercises, raiseGlobalMax } from "@/lib/workout/exercises";
import {
  mapExercise,
  mapPhaseMax,
  mapWorkoutPhase,
} from "@/lib/workout/map-rows";

export async function setPhaseMax(
  userId: string,
  phaseId: string,
  input: { exercise_id: string; max_weight: number },
): Promise<PhaseMax> {
  const phase = await getOwnedPhase(userId, phaseId);
  if (!phase) {
    throw new Error("Этап не найден.");
  }

  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("phase_maxes")
    .insert({
      user_id: userId,
      phase_id: phaseId,
      exercise_id: input.exercise_id,
      max_weight: input.max_weight,
      source: "manual",
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Phase max insert failed");
  }

  const mapped = mapPhaseMax(inserted.data as Record<string, unknown>);
  await raiseGlobalMax({
    userId,
    exerciseId: input.exercise_id,
    maxWeight: input.max_weight,
    achievedAt: await getUserCalendarToday(userId),
    phaseId,
  });
  return mapped;
}

export async function listPhaseMaxRows(
  userId: string,
  phaseId: string,
): Promise<PhaseMaxRow[]> {
  const exercises = await listExercises(userId, "active");
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("phase_maxes")
    .select("*")
    .eq("user_id", userId)
    .eq("phase_id", phaseId)
    .order("set_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  const latest = new Map<string, PhaseMax>();
  for (const row of result.data ?? []) {
    const record = mapPhaseMax(row as Record<string, unknown>);
    if (!latest.has(record.exercise_id)) {
      latest.set(record.exercise_id, record);
    }
  }

  return exercises.map((exercise) => ({
    exercise,
    phase_max: latest.get(exercise.id) ?? null,
    proposed_weight: latest.get(exercise.id)?.max_weight ?? null,
  }));
}

export async function latestWeightsByExercise(
  userId: string,
  phaseId: string,
): Promise<Map<string, number>> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("phase_maxes")
    .select("*")
    .eq("user_id", userId)
    .eq("phase_id", phaseId)
    .order("set_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  const latest = new Map<string, number>();
  for (const row of result.data ?? []) {
    const record = mapPhaseMax(row as Record<string, unknown>);
    if (!latest.has(record.exercise_id)) {
      latest.set(record.exercise_id, record.max_weight);
    }
  }

  return latest;
}

export async function exerciseNamesById(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (exerciseIds.length === 0) {
    return names;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .in("id", exerciseIds);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const exercise = mapExercise(row as Record<string, unknown>);
    names.set(exercise.id, exercise.short_name || exercise.name);
  }

  return names;
}

async function getOwnedPhase(
  userId: string,
  phaseId: string,
): Promise<WorkoutPhase | null> {
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
