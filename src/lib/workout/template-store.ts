import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Exercise, WorkoutTemplateDetail } from "@/lib/types";
import { mapExercise, mapWorkoutTemplate } from "@/lib/workout/map-rows";
import type { TemplateWriteInput } from "@/lib/workout/template-schema";

export async function listTemplates(
  userId: string,
): Promise<WorkoutTemplateDetail[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  const templates = (result.data ?? []).map((row) =>
    mapWorkoutTemplate(row as Record<string, unknown>),
  );
  const exercisesByTemplate = await listTemplateExerciseMap(
    userId,
    templates.map((item) => item.id),
  );

  return templates.map((template) => ({
    ...template,
    exercises: exercisesByTemplate.get(template.id) ?? [],
  }));
}

export async function listActiveTemplates(
  userId: string,
): Promise<WorkoutTemplateDetail[]> {
  const templates = await listTemplates(userId);
  return templates.filter((template) => template.is_active);
}

export async function getTemplate(
  userId: string,
  id: string,
): Promise<WorkoutTemplateDetail | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_templates")
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

  const template = mapWorkoutTemplate(result.data as Record<string, unknown>);
  const exercises = await listTemplateExerciseMap(userId, [template.id]);
  return {
    ...template,
    exercises: exercises.get(template.id) ?? [],
  };
}

export async function createTemplate(
  userId: string,
  input: TemplateWriteInput,
): Promise<WorkoutTemplateDetail> {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("workout_templates")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  const sortOrder =
    existing.data && typeof existing.data.sort_order === "number"
      ? existing.data.sort_order + 10
      : 10;

  const inserted = await supabase
    .from("workout_templates")
    .insert({
      user_id: userId,
      name: input.name,
      kind: input.kind,
      is_active: input.is_active ?? true,
      sort_order: sortOrder,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Template insert failed");
  }

  const template = mapWorkoutTemplate(inserted.data as Record<string, unknown>);
  await replaceTemplateExercises(
    supabase,
    userId,
    template.id,
    input.exercise_ids,
  );
  const created = await getTemplate(userId, template.id);
  if (!created) {
    throw new Error("Template lookup failed");
  }

  return created;
}

export async function updateTemplate(
  userId: string,
  id: string,
  input: TemplateWriteInput,
): Promise<WorkoutTemplateDetail | null> {
  const current = await getTemplate(userId, id);
  if (!current) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("workout_templates")
    .update({
      name: input.name,
      kind: input.kind,
      is_active: input.is_active ?? current.is_active,
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

  await replaceTemplateExercises(supabase, userId, id, input.exercise_ids);
  return getTemplate(userId, id);
}

async function replaceTemplateExercises(
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

async function listTemplateExerciseMap(
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
