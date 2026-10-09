import type { SupabaseClient } from "@supabase/supabase-js";

import { EXERCISE_CATALOG_SOURCE } from "@/lib/workout/exercise-catalog-constants";
import { starterSourceExerciseId } from "@/lib/workout/starter-catalog-map";

export async function catalogUuidForStarterName(
  supabase: SupabaseClient,
  starterName: string,
): Promise<string | null> {
  const sourceId = starterSourceExerciseId(starterName);
  if (!sourceId) {
    return null;
  }

  const result = await supabase
    .from("catalog_exercises")
    .select("id")
    .eq("source", EXERCISE_CATALOG_SOURCE)
    .eq("source_exercise_id", sourceId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data?.id ?? null;
}

/** Attach catalog_exercise_id to starter rows that are still unlinked. */
export async function linkStarterExercisesToCatalog(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const exercises = await supabase
    .from("exercises")
    .select("id, name, catalog_exercise_id")
    .eq("user_id", userId)
    .is("catalog_exercise_id", null);

  if (exercises.error) {
    throw exercises.error;
  }

  for (const row of exercises.data ?? []) {
    const name = typeof row.name === "string" ? row.name : "";
    const sourceId = starterSourceExerciseId(name);
    if (!sourceId) {
      continue;
    }

    const catalog = await supabase
      .from("catalog_exercises")
      .select("id")
      .eq("source", EXERCISE_CATALOG_SOURCE)
      .eq("source_exercise_id", sourceId)
      .maybeSingle();

    if (catalog.error) {
      throw catalog.error;
    }

    if (!catalog.data?.id) {
      continue;
    }

    const updated = await supabase
      .from("exercises")
      .update({ catalog_exercise_id: catalog.data.id })
      .eq("user_id", userId)
      .eq("id", row.id)
      .eq("name", name);

    if (updated.error) {
      throw updated.error;
    }
  }
}
