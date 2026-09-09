import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ExerciseCategory,
  ExerciseSlot,
  ExerciseWorkoutType,
  FormulaPreset,
  WorkoutKind,
} from "@/lib/types";

type StarterExercise = {
  name: string;
  short_name: string;
  category: ExerciseCategory;
  workout_type: ExerciseWorkoutType;
  slot: ExerciseSlot;
  weight_step: number;
  formula_preset: FormulaPreset;
};

const STARTER_EXERCISES: StarterExercise[] = [
  {
    name: "Приседания со штангой",
    short_name: "присед",
    category: "base",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Румынская тяга",
    short_name: "RDL",
    category: "base",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Жим лёжа",
    short_name: "жим лёжа",
    category: "base",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Жим стоя",
    short_name: "жим стоя",
    category: "base",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Тяга штанги в наклоне",
    short_name: "тяга в наклоне",
    category: "base",
    workout_type: "dynamic",
    slot: "c",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Тяга верхнего блока",
    short_name: "тяга блока",
    category: "base",
    workout_type: "dynamic",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
  },
  {
    name: "Становая тяга",
    short_name: "становая",
    category: "base",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Выпады",
    short_name: "выпады",
    category: "base",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Жим гантелей лёжа",
    short_name: "жим гантелей",
    category: "base",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 1,
    formula_preset: "barbell",
  },
  {
    name: "Отжимания на брусьях",
    short_name: "брусья",
    category: "base",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Подтягивания",
    short_name: "подтягивания",
    category: "base",
    workout_type: "dynamic",
    slot: "c",
    weight_step: 2.5,
    formula_preset: "barbell",
  },
  {
    name: "Тяга горизонтального блока",
    short_name: "тяга гориз.",
    category: "base",
    workout_type: "dynamic",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
  },
];

const STARTER_TEMPLATES: Array<{
  name: string;
  kind: WorkoutKind;
  slot: ExerciseSlot;
}> = [
  { name: "Ноги", kind: "dynamic", slot: "a" },
  { name: "Жим", kind: "dynamic", slot: "b" },
  { name: "Тяга", kind: "dynamic", slot: "c" },
];

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
  const existing = await supabase
    .from("exercises")
    .select("name")
    .eq("user_id", userId);

  if (existing.error) {
    throw existing.error;
  }

  const have = new Set(
    (existing.data ?? [])
      .map((row) => row.name)
      .filter((name): name is string => typeof name === "string"),
  );
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

  if (inserted.error && inserted.error.code !== "23505") {
    throw inserted.error;
  }
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

  for (const [index, template] of STARTER_TEMPLATES.entries()) {
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
      if (created.error.code === "23505") {
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

    if (items.error && items.error.code !== "23505") {
      throw items.error;
    }
  }
}
