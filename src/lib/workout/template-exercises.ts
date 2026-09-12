import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";
import { mapExercise } from "@/lib/workout/map-rows";

export async function replaceTemplateExercises(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  templateId: string,
  exerciseIds: string[],
): Promise<void> {
  const deleted = await supabase
    .from("workout_template_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("template_id", templateId);

  if (deleted.error) {
    throw deleted.error;
  }

  if (exerciseIds.length === 0) {
    return;
  }

  const inserted = await supabase.from("workout_template_exercises").insert(
    exerciseIds.map((exerciseId, index) => ({
      user_id: userId,
      template_id: templateId,
      exercise_id: exerciseId,
      sort_order: (index + 1) * 10,
    })),
  );

  if (inserted.error) {
    throw inserted.error;
  }
}

export async function listTemplateExerciseMap(
  userId: string,
  templateIds: string[],
): Promise<Map<string, Exercise[]>> {
  const map = new Map<string, Exercise[]>();
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

    const current = map.get(templateId) ?? [];
    current.push(exercise);
    map.set(templateId, current);
  }

  return map;
}
