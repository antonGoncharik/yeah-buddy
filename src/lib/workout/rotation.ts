import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import type { RotationPatch } from "@/lib/workout/template-schema";
import {
  listActiveTemplates,
  listTemplates,
} from "@/lib/workout/template-store";

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

export function templateAfter<T extends { id: string }>(
  templates: T[],
  lastId: string | null,
): T | null {
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

async function getLastTemplateId(
  userId: string,
  phaseId: string | null,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("workout_sessions")
    .select("template_id")
    .eq("user_id", userId)
    .eq("status", "completed")
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
