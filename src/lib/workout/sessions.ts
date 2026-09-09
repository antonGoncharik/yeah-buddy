import { z } from "zod";

import {
  isIsoDate,
  markDateAsTrainingIfExists,
  previousIsoDate,
} from "@/lib/days";
import { WORKOUTS_NEED_MAXES } from "@/lib/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  RecentWorkoutSession,
  SessionStatus,
  TodayWorkoutState,
  WorkoutKind,
  WorkoutSession,
} from "@/lib/types";
import { listExercises } from "@/lib/workout/exercises";
import { templateHasPlanMaxes } from "@/lib/workout/hints";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { toNullableString } from "@/lib/workout/numbers";
import { ensureStarterExercises } from "@/lib/workout/seed";
import { listSessionWorkInfo } from "@/lib/workout/session-log";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
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
  constructor(message = "На эту дату тренировка уже есть.") {
    super(message);
  }
}

export class SessionNeedsMaxesError extends Error {
  constructor() {
    super(WORKOUTS_NEED_MAXES);
    this.name = "SessionNeedsMaxesError";
  }
}

export const createSessionSchema = z.object({
  session_date: z.string().refine(isIsoDate, "Проверь дату."),
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

export async function listSessionsOnDate(
  userId: string,
  date: string,
): Promise<WorkoutSession[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("session_date", date)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) =>
    mapWorkoutSession(row as Record<string, unknown>),
  );
}

export async function getSessionOnDate(
  userId: string,
  date: string,
): Promise<WorkoutSession | null> {
  const sessions = await listSessionsOnDate(userId, date);
  return sessions[0] ?? null;
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
): Promise<TodayWorkoutState> {
  const settings = await ensureWorkoutSettings(userId);
  await ensureStarterExercises(createSupabaseServerClient(), userId);
  const onDate = await listSessionsOnDate(userId, date);
  const gym = onDate[0] ?? null;
  const macro = await getCurrentMacroState(userId);
  const nextTemplate = await getNextTemplate(userId, macro.phase?.id ?? null);
  const active = await listActiveTemplates(userId);
  const followingTemplate =
    nextTemplate && active.length > 1
      ? templateAfter(active, nextTemplate.id)
      : null;
  const sessionTemplate = gym?.template_id
    ? await getTemplate(userId, gym.template_id)
    : null;

  const yesterdayGym = await getSessionOnDate(userId, previousIsoDate(date));

  return {
    session: gym,
    next_template: nextTemplate,
    following_template:
      followingTemplate && followingTemplate.id !== nextTemplate?.id
        ? followingTemplate
        : null,
    session_template: sessionTemplate,
    unfinished: await listUnfinishedGym(userId, date),
    recent: await listSessionHistory(userId, {
      limit: 5,
      statuses: ["completed"],
    }).then((page) => page.items),
    can_unskip: settings.skip_template_ids.length > 0,
    can_backfill_yesterday: yesterdayGym == null,
    phase_circle: macro.phase_circle,
  };
}

export async function listSessionHistory(
  userId: string,
  options: {
    before?: string;
    since?: string;
    limit: number;
    statuses?: SessionStatus[];
  },
): Promise<{ items: RecentWorkoutSession[]; next_before: string | null }> {
  const limit = Math.min(Math.max(options.limit, 1), 50);
  const statuses = options.statuses ?? ["completed", "skipped"];
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", statuses)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (options.before && isIsoDate(options.before)) {
    query = query.lt("session_date", options.before);
  }

  if (options.since && isIsoDate(options.since)) {
    query = query.gte("session_date", options.since);
  }

  const result = await query;
  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []).map((row) =>
    mapWorkoutSession(row as Record<string, unknown>),
  );
  const hasMore = rows.length > limit;
  const sessions = hasMore ? rows.slice(0, limit) : rows;
  const names = await templateNamesById(
    userId,
    sessions.flatMap((session) =>
      session.template_id ? [session.template_id] : [],
    ),
  );
  const work = await listSessionWorkInfo(userId, sessions);

  return {
    items: sessions.map((session) => {
      const info = work.get(session.id);
      return {
        session,
        template_name: session.template_id
          ? (names.get(session.template_id) ?? null)
          : null,
        summary: info?.summary ?? null,
        plan_hit: info?.plan_hit ?? 0,
        plan_total: info?.plan_total ?? 0,
      };
    }),
    next_before: hasMore ? (sessions.at(-1)?.session_date ?? null) : null,
  };
}

async function listUnfinishedGym(
  userId: string,
  exceptDate: string,
): Promise<RecentWorkoutSession[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "planned")
    .neq("session_date", exceptDate)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  if (result.error) {
    throw result.error;
  }

  const sessions = (result.data ?? []).map((row) =>
    mapWorkoutSession(row as Record<string, unknown>),
  );
  const names = await templateNamesById(
    userId,
    sessions.flatMap((session) =>
      session.template_id ? [session.template_id] : [],
    ),
  );

  return sessions.map((session) => ({
    session,
    template_name: session.template_id
      ? (names.get(session.template_id) ?? null)
      : null,
    summary: null,
    plan_hit: 0,
    plan_total: 0,
  }));
}

async function templateNamesById(
  userId: string,
  templateIds: string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = [...new Set(templateIds)];
  if (unique.length === 0) {
    return names;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_templates")
    .select("id, name")
    .eq("user_id", userId)
    .in("id", unique);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    if (typeof row.id === "string" && typeof row.name === "string") {
      names.set(row.id, row.name);
    }
  }

  return names;
}

export async function createSession(
  userId: string,
  input: CreateSessionInput,
): Promise<WorkoutSession> {
  const existing = await getSessionOnDate(userId, input.session_date);
  if (existing) {
    throw new SessionConflictError();
  }

  const template = await getTemplate(userId, input.template_id);
  if (!template) {
    throw new TemplateNotFoundError();
  }

  const catalog = await listExercises(userId, "active");
  if (!templateHasPlanMaxes(template, catalog)) {
    throw new SessionNeedsMaxesError();
  }

  const macro = await getCurrentMacroState(userId);
  return insertSession(userId, {
    session_date: input.session_date,
    workout_type: template.kind,
    template_id: template.id,
    macro_cycle_id: macro.macro?.id ?? null,
    phase_id: macro.phase?.id ?? null,
    note: input.note ?? null,
  });
}

async function insertSession(
  userId: string,
  input: {
    session_date: string;
    workout_type: WorkoutKind;
    template_id: string | null;
    macro_cycle_id: string | null;
    phase_id: string | null;
    note: string | null;
  },
): Promise<WorkoutSession> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      session_date: input.session_date,
      macro_cycle_id: input.macro_cycle_id,
      phase_id: input.phase_id,
      workout_type: input.workout_type,
      template_id: input.template_id,
      status: "planned",
      note: input.note,
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
