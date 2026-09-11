import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Exercise, ExerciseWithMax } from "@/lib/types";
import type {
  ExerciseCreateInput,
  ExerciseUpdateInput,
} from "@/lib/workout/exercise-schema";
import {
  attachMaxes,
  copyMaxToCurrentPhase,
  correctStartingMax,
  insertGlobalMax,
  listGlobalMaxes,
  resolveAchievedAt,
} from "@/lib/workout/global-maxes";
import { defaultUnitForWorkoutType } from "@/lib/workout/labels";
import { mapExercise } from "@/lib/workout/map-rows";

export async function listExercises(
  userId: string,
  filter: "active" | "archived" | "all" = "active",
): Promise<ExerciseWithMax[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (filter === "active") {
    query = query.eq("is_active", true);
  } else if (filter === "archived") {
    query = query.eq("is_active", false);
  }

  const result = await query;
  if (result.error) {
    throw result.error;
  }

  const exercises = (result.data ?? []).map((row) =>
    mapExercise(row as Record<string, unknown>),
  );
  const maxes = await listGlobalMaxes(
    userId,
    exercises.map((exercise) => exercise.id),
  );

  return exercises.map((exercise) => attachMaxes(exercise, maxes));
}

export async function getExercise(
  userId: string,
  id: string,
): Promise<ExerciseWithMax | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  const exercise = mapExercise(result.data as Record<string, unknown>);
  const maxes = await listGlobalMaxes(userId, [exercise.id]);
  return attachMaxes(exercise, maxes);
}

export async function ensureNamedExercise(
  userId: string,
  input: {
    name: string;
    short_name: string | null;
    category: Exercise["category"];
    workout_type: Exercise["workout_type"];
    unit: Exercise["unit"];
    weight_step: number;
    formula_preset: Exercise["formula_preset"];
  },
): Promise<Exercise> {
  const catalog = await listExercises(userId, "all");
  const needle = input.name.trim().toLowerCase();
  const found = catalog.find(
    (exercise) => exercise.name.trim().toLowerCase() === needle,
  );
  if (found) {
    if (!found.is_active) {
      await archiveExercise(userId, found.id, false);
    }
    return found;
  }

  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("exercises")
    .insert({
      user_id: userId,
      name: input.name,
      short_name: input.short_name,
      category: input.category,
      workout_type: input.workout_type,
      unit: input.unit,
      weight_step: input.weight_step,
      formula_preset: input.formula_preset,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Exercise insert failed");
  }

  return mapExercise(inserted.data as Record<string, unknown>);
}

export async function createExercise(
  userId: string,
  input: ExerciseCreateInput,
): Promise<ExerciseWithMax> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("exercises")
    .insert({
      user_id: userId,
      name: input.name,
      short_name: input.short_name,
      category: input.category,
      workout_type: input.workout_type,
      unit: input.unit,
      weight_step: input.weight_step,
      formula_preset: input.formula_preset,
      slot: input.slot,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Exercise insert failed");
  }

  const exercise = mapExercise(inserted.data as Record<string, unknown>);
  await insertGlobalMax(userId, {
    exerciseId: exercise.id,
    maxWeight: input.max_weight,
    achievedAt: resolveAchievedAt(input.achieved_at),
  });
  await copyMaxToCurrentPhase(supabase, userId, exercise.id, input.max_weight);

  const created = await getExercise(userId, exercise.id);
  if (!created) {
    throw new Error("Exercise lookup failed");
  }

  return created;
}

export async function updateExercise(
  userId: string,
  id: string,
  input: ExerciseUpdateInput,
): Promise<ExerciseWithMax | null> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("exercises")
    .update({
      name: input.name,
      short_name: input.short_name ?? null,
      category: input.category,
      workout_type: input.workout_type,
      unit: input.unit ?? defaultUnitForWorkoutType(input.workout_type),
      ...(input.weight_step != null ? { weight_step: input.weight_step } : {}),
      ...(input.formula_preset != null
        ? { formula_preset: input.formula_preset }
        : {}),
      ...(input.slot !== undefined ? { slot: input.slot } : {}),
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    return null;
  }

  if (input.max_weight != null) {
    await correctStartingMax({
      userId,
      exerciseId: id,
      maxWeight: input.max_weight,
    });
  }

  return getExercise(userId, id);
}

export async function archiveExercise(
  userId: string,
  id: string,
  archived: boolean,
): Promise<ExerciseWithMax | null> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("exercises")
    .update({
      is_active: !archived,
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    return null;
  }

  return getExercise(userId, id);
}
