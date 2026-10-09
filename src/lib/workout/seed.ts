import type { SupabaseClient } from "@supabase/supabase-js";

import { seededNames, throwUnlessUniqueViolation } from "@/lib/seed-missing";
import {
  dedupeStarterExercises,
  exerciseNameKey,
} from "@/lib/workout/dedupe-exercises";
import { catalogUuidForStarterName } from "@/lib/workout/starter-catalog-link";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

export async function ensureStarterExercises(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // Login can race itself; collapse starter-name copies before inserting.
  await dedupeStarterExercises(supabase, userId);

  const have = await seededNames(supabase, "exercises", userId);
  const haveKeys = new Set([...have].map((name) => exerciseNameKey(name)));
  const missing = STARTER_EXERCISES.filter(
    (exercise) => !haveKeys.has(exerciseNameKey(exercise.name)),
  );
  if (missing.length > 0) {
    const rows = [];
    for (const exercise of missing) {
      const catalogExerciseId = await catalogUuidForStarterName(
        supabase,
        exercise.name,
      );
      rows.push({
        user_id: userId,
        name: exercise.name,
        short_name: exercise.short_name,
        category: exercise.category,
        workout_type: exercise.workout_type,
        unit: exercise.workout_type === "static" ? "seconds" : "reps",
        weight_step: exercise.weight_step,
        formula_preset: exercise.formula_preset,
        slot: exercise.slot,
        ...(catalogExerciseId ? { catalog_exercise_id: catalogExerciseId } : {}),
      });
    }

    const inserted = await supabase.from("exercises").insert(rows);

    throwUnlessUniqueViolation(inserted.error);
    // A parallel seed may have won the insert; drop any leftover copies.
    await dedupeStarterExercises(supabase, userId);
  }

  const { linkStarterExercisesToCatalog } = await import(
    "@/lib/workout/starter-catalog-link"
  );
  await linkStarterExercisesToCatalog(supabase, userId);
}
