import type { SupabaseClient } from "@supabase/supabase-js";

import {
  seededNames,
  throwUnlessUniqueViolation,
  UNIQUE_VIOLATION,
} from "@/lib/seed-missing";
import type { ExerciseSlot } from "@/lib/types";
import {
  STARTER_EXERCISES,
  STARTER_WORKOUT_TEMPLATES,
} from "@/lib/workout/starter-exercises";

export async function ensureStarterExercises(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await seedMissingExercises(supabase, userId);
  await seedTemplatesIfEmpty(supabase, userId);
}

async function seedMissingExercises(
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

async function seedTemplatesIfEmpty(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const existing = await supabase
    .from("workout_templates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (existing.error) {
    throw existing.error;
  }

  if ((existing.count ?? 0) > 0) {
    return;
  }

  const exerciseRows = await supabase
    .from("exercises")
    .select("id, slot")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const bySlot: Record<ExerciseSlot, string[]> = { a: [], b: [], c: [] };
  for (const row of exerciseRows.data ?? []) {
    const slot: unknown = row.slot;
    if (slot === "a" || slot === "b" || slot === "c") {
      bySlot[slot].push(String(row.id));
    }
  }

  for (const [index, template] of STARTER_WORKOUT_TEMPLATES.entries()) {
    const created = await supabase
      .from("workout_templates")
      .insert({
        user_id: userId,
        name: template.name,
        kind: template.kind,
        sort_order: (index + 1) * 10,
        is_active: true,
      })
      .select("id")
      .single();

    if (created.error) {
      if (created.error.code === UNIQUE_VIOLATION) {
        continue;
      }
      throw created.error;
    }

    if (!created.data || typeof created.data.id !== "string") {
      throw new Error("Template seed failed");
    }

    const exerciseIds = bySlot[template.slot];
    if (exerciseIds.length === 0) {
      continue;
    }

    const items = await supabase.from("workout_template_exercises").insert(
      exerciseIds.map((exerciseId, exerciseIndex) => ({
        user_id: userId,
        template_id: created.data.id,
        exercise_id: exerciseId,
        sort_order: (exerciseIndex + 1) * 10,
      })),
    );

    throwUnlessUniqueViolation(items.error);
  }
}
