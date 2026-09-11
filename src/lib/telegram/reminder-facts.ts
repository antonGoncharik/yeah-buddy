import { createSupabaseServerClient } from "@/lib/supabase/server";
import { templateAfter } from "@/lib/workout/templates";

export async function dateHasFoodRecord(
  userId: string,
  date: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("days")
    .select("id, meals!inner(id, meal_items!inner(id))")
    .eq("user_id", userId)
    .eq("date", date)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data != null;
}

export async function nextCircleName(userId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const templatesResult = await supabase
    .from("workout_templates")
    .select("id, name, sort_order")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (templatesResult.error) {
    throw templatesResult.error;
  }

  const templates = (templatesResult.data ?? []).flatMap((row) => {
    const record = row as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      return [];
    }
    return [{ id: record.id, name: record.name }];
  });
  if (templates.length === 0) {
    return null;
  }

  const skipped = new Set(await skipTemplateIds(userId));
  const lastId = await lastCompletedTemplateId(userId);
  let current = templateAfter(templates, lastId);

  for (let step = 0; step < templates.length; step += 1) {
    if (!current) {
      return templates[0]?.name ?? null;
    }
    if (!skipped.has(current.id)) {
      return current.name;
    }
    current = templateAfter(templates, current.id);
  }

  return templates[0]?.name ?? null;
}

async function skipTemplateIds(userId: string): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_settings")
    .select("skip_template_ids")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  const raw = result.data?.skip_template_ids;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((id): id is string => typeof id === "string");
}

async function lastCompletedTemplateId(userId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const phase = await supabase
    .from("workout_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "current")
    .maybeSingle();

  if (phase.error) {
    throw phase.error;
  }

  let query = supabase
    .from("workout_sessions")
    .select("template_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("template_id", "is", null)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (typeof phase.data?.id === "string") {
    query = query.eq("phase_id", phase.data.id);
  }

  const last = await query.maybeSingle();
  if (last.error) {
    throw last.error;
  }

  return typeof last.data?.template_id === "string"
    ? last.data.template_id
    : null;
}
