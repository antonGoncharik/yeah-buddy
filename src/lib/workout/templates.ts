import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Exercise,
  WorkoutKind,
  WorkoutTemplate,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { mapExercise } from "@/lib/workout/exercises";
import { toNumber } from "@/lib/workout/numbers";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export class TemplateNotFoundError extends Error {
  constructor() {
    super("Шаблон не найден.");
  }
}

export const templateWriteSchema = z.object({
  name: z.string().trim().min(1, "Название обязательно."),
  kind: z.enum(["dynamic", "static"]),
  is_active: z.boolean().optional(),
  exercise_ids: z.array(z.string().uuid()),
});

export const rotationPatchSchema = z.object({
  rotation: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int(),
      is_active: z.boolean(),
    }),
  ),
});

export type TemplateWriteInput = z.infer<typeof templateWriteSchema>;
export type RotationPatch = z.infer<typeof rotationPatchSchema>;

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

export async function saveRotation(
  userId: string,
  patch: RotationPatch,
): Promise<WorkoutTemplateDetail[]> {
  const supabase = createSupabaseServerClient();
  for (const item of patch.rotation) {
    const updated = await supabase
      .from("workout_templates")
      .update({
        sort_order: item.sort_order,
        is_active: item.is_active,
      })
      .eq("user_id", userId)
      .eq("id", item.id);

    if (updated.error) {
      throw updated.error;
    }
  }

  return listTemplates(userId);
}

export async function getNextTemplate(
  userId: string,
  phaseId: string | null,
): Promise<WorkoutTemplateDetail | null> {
  const templates = await listActiveTemplates(userId);
  if (templates.length === 0) {
    return null;
  }

  const settings = await ensureWorkoutSettings(userId);
  const skipped = new Set(settings.skip_template_ids);
  const lastId = await getLastTemplateId(userId, phaseId);
  let current = templateAfter(templates, lastId);

  for (let step = 0; step < templates.length; step += 1) {
    if (!current) {
      return templates[0] ?? null;
    }
    if (!skipped.has(current.id)) {
      return current;
    }
    current = templateAfter(templates, current.id);
  }

  return templates[0] ?? null;
}

export function templateAfter(
  templates: WorkoutTemplateDetail[],
  lastId: string | null,
): WorkoutTemplateDetail | null {
  if (templates.length === 0) {
    return null;
  }

  if (!lastId) {
    return templates[0] ?? null;
  }

  const index = templates.findIndex((template) => template.id === lastId);
  if (index < 0) {
    return templates[0] ?? null;
  }

  return templates[(index + 1) % templates.length] ?? null;
}

export function mapWorkoutTemplate(
  row: Record<string, unknown>,
): WorkoutTemplate {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    kind: toKind(row.kind),
    sort_order: toNumber(row.sort_order),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function getLastTemplateId(
  userId: string,
  phaseId: string | null,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("workout_sessions")
    .select("template_id")
    .eq("user_id", userId)
    .neq("status", "skipped")
    .not("template_id", "is", null)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (phaseId) {
    query = query.eq("phase_id", phaseId);
  }

  const last = await query.maybeSingle();
  if (last.error) {
    throw last.error;
  }

  if (!last.data?.template_id) {
    return null;
  }

  return String(last.data.template_id);
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

function toKind(value: unknown): WorkoutKind {
  return value === "static" ? "static" : "dynamic";
}
