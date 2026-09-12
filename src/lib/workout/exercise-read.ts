import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExerciseWithMax } from "@/lib/types";
import { attachMaxes, listGlobalMaxes } from "@/lib/workout/global-maxes";
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
