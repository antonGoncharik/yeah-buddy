import { isIsoDate } from "@/lib/day/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Exercise, ExerciseWithMax, GlobalMax } from "@/lib/types";
import { StartingMaxLockedError } from "@/lib/workout/exercise-schema";
import { mapGlobalMax } from "@/lib/workout/map-rows";

export async function correctStartingMax(input: {
  userId: string;
  exerciseId: string;
  maxWeight: number;
}): Promise<GlobalMax> {
  if (await hasCurrentPhase(input.userId)) {
    throw new StartingMaxLockedError();
  }

  const maxes = await listGlobalMaxes(input.userId, [input.exerciseId]);
  const current = pickCurrentMax(maxes.get(input.exerciseId) ?? []);
  if (!current) {
    return insertGlobalMax(input.userId, {
      exerciseId: input.exerciseId,
      maxWeight: input.maxWeight,
      achievedAt: resolveAchievedAt(undefined),
    });
  }

  if (current.max_weight === input.maxWeight) {
    return current;
  }

  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("global_maxes")
    .update({ max_weight: input.maxWeight })
    .eq("user_id", input.userId)
    .eq("id", current.id)
    .select("*")
    .single();

  if (updated.error || !updated.data) {
    throw updated.error ?? new Error("Global max update failed");
  }

  return mapGlobalMax(updated.data as Record<string, unknown>);
}

export async function raiseGlobalMax(input: {
  userId: string;
  exerciseId: string;
  maxWeight: number;
  achievedAt: string;
  phaseId?: string | null;
  workoutSessionId?: string | null;
}): Promise<GlobalMax | null> {
  const maxes = await listGlobalMaxes(input.userId, [input.exerciseId]);
  const current = pickCurrentMax(maxes.get(input.exerciseId) ?? []);
  if (current && input.maxWeight <= current.max_weight) {
    return current;
  }

  return insertGlobalMax(input.userId, {
    exerciseId: input.exerciseId,
    maxWeight: input.maxWeight,
    achievedAt: input.achievedAt,
    phaseId: input.phaseId ?? null,
    workoutSessionId: input.workoutSessionId ?? null,
  });
}

export async function listGlobalMaxes(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, GlobalMax[]>> {
  const byExercise = new Map<string, GlobalMax[]>();
  if (exerciseIds.length === 0) {
    return byExercise;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("global_maxes")
    .select("*")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds)
    .order("achieved_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const record = mapGlobalMax(row as Record<string, unknown>);
    const current = byExercise.get(record.exercise_id) ?? [];
    current.push(record);
    byExercise.set(record.exercise_id, current);
  }

  return byExercise;
}

export async function copyMaxToCurrentPhase(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  exerciseId: string,
  maxWeight: number,
): Promise<void> {
  const currentPhase = await supabase
    .from("workout_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "current")
    .maybeSingle();

  if (currentPhase.error) {
    throw currentPhase.error;
  }

  if (!currentPhase.data) {
    return;
  }

  const inserted = await supabase.from("phase_maxes").insert({
    user_id: userId,
    phase_id: currentPhase.data.id,
    exercise_id: exerciseId,
    max_weight: maxWeight,
    source: "manual",
  });

  if (inserted.error) {
    throw inserted.error;
  }
}

export async function insertGlobalMax(
  userId: string,
  input: {
    exerciseId: string;
    maxWeight: number;
    achievedAt: string;
    phaseId?: string | null;
    workoutSessionId?: string | null;
  },
): Promise<GlobalMax> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("global_maxes")
    .insert({
      user_id: userId,
      exercise_id: input.exerciseId,
      max_weight: input.maxWeight,
      achieved_at: input.achievedAt,
      phase_id: input.phaseId ?? null,
      workout_session_id: input.workoutSessionId ?? null,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Global max insert failed");
  }

  return mapGlobalMax(inserted.data as Record<string, unknown>);
}

export function attachMaxes(
  exercise: Exercise,
  maxes: Map<string, GlobalMax[]>,
): ExerciseWithMax {
  const history = maxes.get(exercise.id) ?? [];
  return {
    ...exercise,
    current_max: pickCurrentMax(history),
    max_history: history,
  };
}

export function resolveAchievedAt(value: string | undefined): string {
  if (value && isIsoDate(value)) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

async function hasCurrentPhase(userId: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "current")
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return Boolean(result.data);
}

export function pickCurrentMax(history: GlobalMax[]): GlobalMax | null {
  if (history.length === 0) {
    return null;
  }

  return history.reduce((best, record) => {
    if (record.max_weight > best.max_weight) {
      return record;
    }

    if (record.max_weight === best.max_weight) {
      if (record.achieved_at > best.achieved_at) {
        return record;
      }

      if (
        record.achieved_at === best.achieved_at &&
        record.created_at > best.created_at
      ) {
        return record;
      }
    }

    return best;
  });
}
