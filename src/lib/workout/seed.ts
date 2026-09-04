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
  max_weight: number;
};

export const STARTER_EXERCISES: StarterExercise[] = [
  {
    name: "присед в колодец",
    short_name: "присед",
    category: "base",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 2.5,
    formula_preset: "barbell",
    max_weight: 230,
  },
  {
    name: "румынская тяга",
    short_name: "RDL",
    category: "base",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 2.5,
    formula_preset: "barbell",
    max_weight: 147,
  },
  {
    name: "подъем на икры стоя со штангой в смитте",
    short_name: "икры",
    category: "isolation",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 2.5,
    formula_preset: "barbell",
    max_weight: 147,
  },
  {
    name: "жим со штангой сидя",
    short_name: "жим сидя",
    category: "base",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 2.5,
    formula_preset: "barbell",
    max_weight: 126,
  },
  {
    name: "махи с гантелями на среднюю дельту",
    short_name: "средняя дельта",
    category: "isolation",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 33,
  },
  {
    name: "махи с гантелями на заднюю дельту",
    short_name: "задняя дельта",
    category: "isolation",
    workout_type: "dynamic",
    slot: "a",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 27,
  },
  {
    name: "жим со штангой лежа",
    short_name: "жим лежа",
    category: "base",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 2.5,
    formula_preset: "barbell",
    max_weight: 154,
  },
  {
    name: "жим со штангой на наклонной скамье",
    short_name: "жим наклонный",
    category: "base",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 2.5,
    formula_preset: "barbell",
    max_weight: 120,
  },
  {
    name: "отжимания на брусьях в тренажере одной рукой",
    short_name: "брусья",
    category: "isolation",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 63,
  },
  {
    name: "тяга верхнего блока одной рукой с ручкой",
    short_name: "тяга блока",
    category: "isolation",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 74,
  },
  {
    name: "тяга Мэдоуза",
    short_name: "Мэдоуз",
    category: "isolation",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 74,
  },
  {
    name: "шраги со штангой",
    short_name: "шраги",
    category: "isolation",
    workout_type: "dynamic",
    slot: "b",
    weight_step: 2.5,
    formula_preset: "barbell",
    max_weight: 264,
  },
  {
    name: "сгибание проксимальный фаланг пальцев с ручкой на лямках на блоке",
    short_name: "пальцы",
    category: "armwrestling",
    workout_type: "both",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 33,
  },
  {
    name: "сгибание кисти с ручкой на лямках на блоке",
    short_name: "кисть",
    category: "armwrestling",
    workout_type: "both",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 35,
  },
  {
    name: "сгибание кисти с ручкой Ларратта",
    short_name: "Ларратт",
    category: "armwrestling",
    workout_type: "both",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 22,
  },
  {
    name: "отведение кисти на блоке",
    short_name: "отведение",
    category: "armwrestling",
    workout_type: "both",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 22,
  },
  {
    name: "пронация предплечья с лямкой на блоке",
    short_name: "пронация",
    category: "armwrestling",
    workout_type: "both",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 37,
  },
  {
    name: "подъем на плечелучевую с лямкой с нижнего блока",
    short_name: "плечелучевая",
    category: "armwrestling",
    workout_type: "both",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 80,
  },
  {
    name: "подъем на бицепс с ручкой с нижнего блока",
    short_name: "бицепс",
    category: "armwrestling",
    workout_type: "both",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 74,
  },
  {
    name: "боковой нажим корпусом",
    short_name: "боковой",
    category: "armwrestling",
    workout_type: "both",
    slot: "c",
    weight_step: 1,
    formula_preset: "cable",
    max_weight: 38,
  },
];

export async function ensureStarterExercises(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const existing = await supabase
    .from("exercises")
    .select("id, name, slot, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (existing.error) {
    throw existing.error;
  }

  const byName = new Map<string, { id: string; slot: unknown }>();
  const duplicateIds: string[] = [];
  for (const row of existing.data ?? []) {
    const key = normalizeName(String(row.name));
    if (byName.has(key)) {
      duplicateIds.push(String(row.id));
      continue;
    }
    byName.set(key, { id: String(row.id), slot: row.slot });
  }

  if (duplicateIds.length > 0) {
    const archived = await supabase
      .from("exercises")
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .in("id", duplicateIds);

    if (archived.error) {
      throw archived.error;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const phaseId = await currentPhaseId(supabase, userId);
  const insertedIds: Array<{ id: string; maxWeight: number }> = [];

  for (const exercise of STARTER_EXERCISES) {
    const match = byName.get(normalizeName(exercise.name));
    if (match) {
      if (match.slot == null) {
        const patched = await supabase
          .from("exercises")
          .update({
            short_name: exercise.short_name,
            category: exercise.category,
            workout_type: exercise.workout_type,
            weight_step: exercise.weight_step,
            formula_preset: exercise.formula_preset,
            slot: exercise.slot,
          })
          .eq("id", match.id)
          .eq("user_id", userId);

        if (patched.error) {
          throw patched.error;
        }
      }
      continue;
    }

    const inserted = await supabase
      .from("exercises")
      .insert({
        user_id: userId,
        name: exercise.name,
        short_name: exercise.short_name,
        category: exercise.category,
        workout_type: exercise.workout_type,
        unit: exercise.workout_type === "static" ? "seconds" : "reps",
        weight_step: exercise.weight_step,
        formula_preset: exercise.formula_preset,
        slot: exercise.slot,
      })
      .select("id")
      .single();

    if (inserted.error) {
      if (inserted.error.code === "23505") {
        continue;
      }
      throw inserted.error;
    }

    if (!inserted.data) {
      throw new Error("Exercise seed failed");
    }

    const maxInsert = await supabase.from("global_maxes").insert({
      user_id: userId,
      exercise_id: inserted.data.id,
      max_weight: exercise.max_weight,
      achieved_at: today,
    });

    if (maxInsert.error) {
      throw maxInsert.error;
    }

    insertedIds.push({
      id: inserted.data.id,
      maxWeight: exercise.max_weight,
    });
  }

  if (phaseId && insertedIds.length > 0) {
    const phaseMaxes = await supabase.from("phase_maxes").insert(
      insertedIds.map((item) => ({
        user_id: userId,
        phase_id: phaseId,
        exercise_id: item.id,
        max_weight: item.maxWeight,
        source: "manual",
      })),
    );

    if (phaseMaxes.error) {
      throw phaseMaxes.error;
    }
  }

  await ensureStarterTemplates(supabase, userId);
}

const STARTER_TEMPLATES: Array<{
  name: string;
  kind: WorkoutKind;
  slots: ExerciseSlot[];
  aliases: string[];
}> = [
  {
    name: "Ноги и жим сидя",
    kind: "dynamic",
    slots: ["a"],
    aliases: ["A · ноги и жим сидя"],
  },
  {
    name: "Статика",
    kind: "static",
    slots: ["c"],
    aliases: [],
  },
  {
    name: "Жимы и тяги",
    kind: "dynamic",
    slots: ["b"],
    aliases: ["B · жимы и тяги"],
  },
  {
    name: "Арм",
    kind: "dynamic",
    slots: ["c"],
    aliases: ["C · арм динамика"],
  },
];

export async function ensureStarterTemplates(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const existing = await supabase
    .from("workout_templates")
    .select("id, name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (existing.error) {
    throw existing.error;
  }

  const byName = new Map<string, string>();
  const duplicateIds: string[] = [];
  for (const row of existing.data ?? []) {
    const key = normalizeName(String(row.name));
    if (byName.has(key)) {
      duplicateIds.push(String(row.id));
      continue;
    }
    byName.set(key, String(row.id));
  }

  if (duplicateIds.length > 0) {
    const cleared = await supabase
      .from("workout_sessions")
      .update({ template_id: null })
      .eq("user_id", userId)
      .in("template_id", duplicateIds);

    if (cleared.error) {
      throw cleared.error;
    }

    const removed = await supabase
      .from("workout_templates")
      .delete()
      .eq("user_id", userId)
      .in("id", duplicateIds);

    if (removed.error) {
      throw removed.error;
    }
  }

  const exerciseRows = await supabase
    .from("exercises")
    .select("id, name, slot")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const slotByName = new Map(
    STARTER_EXERCISES.map((exercise) => [
      normalizeName(exercise.name),
      exercise.slot,
    ]),
  );
  const bySlot: Record<ExerciseSlot, string[]> = { a: [], b: [], c: [] };
  for (const row of exerciseRows.data ?? []) {
    const fromRow = row.slot;
    let slot: ExerciseSlot | undefined;
    if (fromRow === "a" || fromRow === "b" || fromRow === "c") {
      slot = fromRow;
    } else {
      slot = slotByName.get(normalizeName(String(row.name)));
    }
    if (slot) {
      bySlot[slot].push(String(row.id));
    }
  }

  let sortOrder = (existing.data?.length ?? 0) * 10 + 10;

  for (const template of STARTER_TEMPLATES) {
    const keys = [
      normalizeName(template.name),
      ...template.aliases.map((alias) => normalizeName(alias)),
    ];
    const matches = keys.flatMap((key) => {
      const id = byName.get(key);
      return id ? [{ key, id }] : [];
    });
    const uniqueIds = [...new Set(matches.map((item) => item.id))];
    const keepId = uniqueIds
      .map((id) => (existing.data ?? []).find((row) => String(row.id) === id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((left, right) =>
        String(left.created_at).localeCompare(String(right.created_at)),
      )[0]?.id;

    if (keepId) {
      const extras = uniqueIds.filter((id) => id !== keepId);
      if (extras.length > 0) {
        const cleared = await supabase
          .from("workout_sessions")
          .update({ template_id: null })
          .eq("user_id", userId)
          .in("template_id", extras);
        if (cleared.error) {
          throw cleared.error;
        }

        const removed = await supabase
          .from("workout_templates")
          .delete()
          .eq("user_id", userId)
          .in("id", extras);
        if (removed.error) {
          throw removed.error;
        }
      }

      const renamed = await supabase
        .from("workout_templates")
        .update({
          name: template.name,
          ...(extras.length > 0
            ? { sort_order: (STARTER_TEMPLATES.indexOf(template) + 1) * 10 }
            : {}),
        })
        .eq("id", keepId)
        .eq("user_id", userId);
      if (renamed.error) {
        throw renamed.error;
      }

      continue;
    }

    const inserted = await supabase
      .from("workout_templates")
      .insert({
        user_id: userId,
        name: template.name,
        kind: template.kind,
        sort_order: sortOrder,
        is_active: true,
      })
      .select("id")
      .single();

    if (inserted.error) {
      if (inserted.error.code === "23505") {
        continue;
      }
      throw inserted.error;
    }

    if (!inserted.data) {
      throw new Error("Template seed failed");
    }

    const exerciseIds = [
      ...new Set(template.slots.flatMap((slot) => bySlot[slot])),
    ];
    if (exerciseIds.length > 0) {
      const items = await supabase.from("workout_template_exercises").insert(
        exerciseIds.map((exerciseId, index) => ({
          user_id: userId,
          template_id: inserted.data.id,
          exercise_id: exerciseId,
          sort_order: (index + 1) * 10,
        })),
      );

      if (items.error) {
        throw items.error;
      }
    }

    sortOrder += 10;
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function currentPhaseId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const result = await supabase
    .from("workout_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "current")
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? String(result.data.id) : null;
}
