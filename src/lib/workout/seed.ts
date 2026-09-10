import type { SupabaseClient } from "@supabase/supabase-js";

import { seededNames, throwUnlessUniqueViolation } from "@/lib/seed-missing";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

export async function ensureStarterExercises(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const have = await seededNames(supabase, "exercises", userId);
  const missing = STARTER_EXERCISES.filter(
    (exercise) => !have.has(exercise.name),
  );
  if (missing.length === 0) {
    return;
  }

  const inserted = await supabase.from("exercises").insert(
    missing.map((exercise) => ({
      user_id: userId,
      name: exercise.name,
      short_name: exercise.short_name,
      category: exercise.category,
      workout_type: exercise.workout_type,
      unit: exercise.workout_type === "static" ? "seconds" : "reps",
      weight_step: exercise.weight_step,
      formula_preset: exercise.formula_preset,
      slot: exercise.slot,
    })),
  );

  throwUnlessUniqueViolation(inserted.error);
}
