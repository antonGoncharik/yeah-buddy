import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { mapWorkoutTemplate } from "@/lib/workout/map-rows";
import {
  listTemplateExerciseMap,
  replaceTemplateExercises,
} from "@/lib/workout/template-exercises";
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
