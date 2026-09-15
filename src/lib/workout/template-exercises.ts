import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Exercise, TemplateSlot } from "@/lib/types";
import { mapExercise } from "@/lib/workout/map-rows";
import { normalizeSlotPlan } from "@/lib/workout/slot-plan";
import { parseSlotPlan } from "@/lib/workout/slot-plan-schema";

export async function replaceTemplateExercises(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  templateId: string,
  slots: TemplateSlot[],
): Promise<void> {
  const deleted = await supabase
    .from("workout_template_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("template_id", templateId);

  if (deleted.error) {
    throw deleted.error;
  }

  const unique = dedupeSlots(slots);
  if (unique.length === 0) {
    return;
  }

  const inserted = await supabase.from("workout_template_exercises").insert(
    unique.map((slot, index) => ({
      user_id: userId,
      template_id: templateId,
      exercise_id: slot.exercise_id,
      sort_order: (index + 1) * 10,
      plan: normalizeSlotPlan(slot.plan),
    })),
  );

  if (inserted.error) {
    throw inserted.error;
  }
}

export interface TemplateSlotRows {
  exercises: Exercise[];
  slots: TemplateSlot[];
}

export async function listTemplateExerciseMap(
  userId: string,
  templateIds: string[],
): Promise<Map<string, TemplateSlotRows>> {
  const map = new Map<string, TemplateSlotRows>();
  if (templateIds.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const rows = await supabase
    .from("workout_template_exercises")
    .select("*")
    .eq("user_id", userId)
    .in("template_id", templateIds)
    .order("sort_order", { ascending: true });

  if (rows.error) {
    throw rows.error;
  }

  const exerciseIds = [
    ...new Set(
      (rows.data ?? []).map((row) => String(row.exercise_id as string)),
    ),
  ];
  const exercisesById = new Map<string, Exercise>();
  if (exerciseIds.length > 0) {
    const exercises = await supabase
      .from("exercises")
      .select("*")
      .eq("user_id", userId)
      .in("id", exerciseIds);

    if (exercises.error) {
      throw exercises.error;
    }

    for (const row of exercises.data ?? []) {
      const exercise = mapExercise(row as Record<string, unknown>);
      exercisesById.set(exercise.id, exercise);
    }
  }

  for (const row of rows.data ?? []) {
    const templateId = String(row.template_id);
    const exercise = exercisesById.get(String(row.exercise_id));
    if (!exercise) {
      continue;
    }

    const current = map.get(templateId) ?? { exercises: [], slots: [] };
    current.exercises.push(exercise);
    current.slots.push({
      exercise_id: exercise.id,
      plan: parseSlotPlan(row.plan),
    });
    map.set(templateId, current);
  }

  return map;
}

function dedupeSlots(slots: TemplateSlot[]): TemplateSlot[] {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    if (seen.has(slot.exercise_id)) {
      return false;
    }
    seen.add(slot.exercise_id);
    return true;
  });
}
