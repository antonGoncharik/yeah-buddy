import { z } from "zod";

import { isIsoDate, markDateAsTrainingIfExists } from "@/lib/days";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  RecentWorkoutSession,
  SessionStatus,
  WorkoutKind,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { toNullableString } from "@/lib/workout/numbers";
import { ensureStarterExercises } from "@/lib/workout/seed";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import { isWorkoutSlot } from "@/lib/workout/slots";
import {
  getNextTemplate,
  getTemplate,
  listActiveTemplates,
  TemplateNotFoundError,
  templateAfter,
} from "@/lib/workout/templates";

export class SessionLockedError extends Error {
  constructor() {
    super("Сделанную тренировку нельзя убрать.");
  }
}

export class SessionConflictError extends Error {
  constructor() {
    super("На эту дату тренировка уже есть.");
  }
}

export const createSessionSchema = z.object({
  session_date: z.string().refine(isIsoDate, "Некорректная дата."),
  template_id: z.string().uuid(),
  note: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value == null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }),
});

export const patchSessionSchema = z.object({
  status: z.enum(["planned", "completed", "skipped"]).optional(),
  note: z.union([z.string(), z.null()]).optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type PatchSessionInput = z.infer<typeof patchSessionSchema>;

export async function getSessionByDate(
  userId: string,
  date: string,
): Promise<WorkoutSession | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("session_date", date)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapWorkoutSession(result.data as Record<string, unknown>);
}

export async function getSession(
  userId: string,
  id: string,
): Promise<WorkoutSession | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
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

  return mapWorkoutSession(result.data as Record<string, unknown>);
}

export async function getTodayWorkoutState(
  userId: string,
  date: string,
): Promise<{
  session: WorkoutSession | null;
  next_template: WorkoutTemplateDetail | null;
  following_template: WorkoutTemplateDetail | null;
  session_template: WorkoutTemplateDetail | null;
  recent: RecentWorkoutSession[];
  can_unskip: boolean;
}> {
  const settings = await ensureWorkoutSettings(userId);
  await ensureStarterExercises(createSupabaseServerClient(), userId);
  const existing = await getSessionByDate(userId, date);
  const macro = await getCurrentMacroState(userId);
  const nextTemplate = await getNextTemplate(userId, macro.phase?.id ?? null);
  const active = await listActiveTemplates(userId);
  const followingTemplate =
    nextTemplate && active.length > 1
      ? templateAfter(active, nextTemplate.id)
      : null;
  const sessionTemplate = existing?.template_id
    ? await getTemplate(userId, existing.template_id)
    : null;

  return {
    session: existing,
    next_template: nextTemplate,
    following_template:
      followingTemplate && followingTemplate.id !== nextTemplate?.id
        ? followingTemplate
        : null,
    session_template: sessionTemplate,
    recent: await listRecentCompletedSessions(userId, 5),
    can_unskip: settings.skip_template_ids.length > 0,
  };
}

export async function listRecentCompletedSessions(
  userId: string,
  limit: number,
): Promise<RecentWorkoutSession[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    throw result.error;
  }

  const sessions = (result.data ?? []).map((row) =>
    mapWorkoutSession(row as Record<string, unknown>),
  );
  const names = new Map<string, string>();
  for (const session of sessions) {
    if (!session.template_id || names.has(session.template_id)) {
      continue;
    }
    const template = await getTemplate(userId, session.template_id);
    if (template) {
      names.set(template.id, template.name);
    }
  }

  return sessions.map((session) => ({
    session,
    template_name: session.template_id
      ? (names.get(session.template_id) ?? null)
      : null,
  }));
}

export async function createSession(
  userId: string,
  input: CreateSessionInput,
): Promise<WorkoutSession> {
  const existing = await getSessionByDate(userId, input.session_date);
  if (existing) {
    throw new SessionConflictError();
  }

  const template = await getTemplate(userId, input.template_id);
  if (!template) {
    throw new TemplateNotFoundError();
  }

  const macro = await getCurrentMacroState(userId);
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      session_date: input.session_date,
      macro_cycle_id: macro.macro?.id ?? null,
      phase_id: macro.phase?.id ?? null,
      workout_type: template.kind,
      template_id: template.id,
      status: "planned",
      note: input.note ?? null,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    if (inserted.error?.code === "23505") {
      throw new SessionConflictError();
    }
    throw inserted.error ?? new Error("Session insert failed");
  }

  await markDateAsTrainingIfExists(userId, input.session_date);

  return mapWorkoutSession(inserted.data as Record<string, unknown>);
}

export async function cancelSession(
  userId: string,
  id: string,
): Promise<boolean> {
  const current = await getSession(userId, id);
  if (!current) {
    return false;
  }

  if (current.status === "completed") {
    throw new SessionLockedError();
  }

  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("workout_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (deleted.error) {
    throw deleted.error;
  }

  return true;
}

export async function patchSession(
  userId: string,
  id: string,
  input: PatchSessionInput,
): Promise<WorkoutSession | null> {
  const current = await getSession(userId, id);
  if (!current) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("workout_sessions")
    .update({
      status: input.status ?? current.status,
      note:
        input.note === undefined ? current.note : toNullableString(input.note),
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

  return mapWorkoutSession(updated.data as Record<string, unknown>);
}

export function mapWorkoutSession(
  row: Record<string, unknown>,
): WorkoutSession {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_date: String(row.session_date).slice(0, 10),
    macro_cycle_id: toNullableString(row.macro_cycle_id),
    phase_id: toNullableString(row.phase_id),
    workout_type: toWorkoutKind(row.workout_type),
    template_id: toNullableString(row.template_id),
    slot: isWorkoutSlot(row.slot) ? row.slot : null,
    status: toSessionStatus(row.status),
    note: toNullableString(row.note),
    created_at: String(row.created_at),
  };
}

function toWorkoutKind(value: unknown): WorkoutKind {
  return value === "static" ? "static" : "dynamic";
}

function toSessionStatus(value: unknown): SessionStatus {
  if (value === "completed" || value === "skipped") {
    return value;
  }

  return "planned";
}
