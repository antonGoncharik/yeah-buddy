import { z } from "zod";

import { isIsoDate } from "@/lib/days";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionStatus, WorkoutKind, WorkoutSession } from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { toNullableString } from "@/lib/workout/numbers";
import { ensureSchedule, isoDayOfWeek } from "@/lib/workout/schedule";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export class SessionConflictError extends Error {
  constructor() {
    super("На эту дату тренировка уже есть.");
  }
}

export class NoCurrentPhaseError extends Error {
  constructor() {
    super("Сначала создайте макроцикл и фазу.");
  }
}

export const createSessionSchema = z.object({
  session_date: z.string().refine(isIsoDate, "Некорректная дата."),
  workout_type: z.enum(["dynamic", "static"]),
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

export async function ensureTodaySession(
  userId: string,
  date: string,
): Promise<{
  session: WorkoutSession | null;
  scheduled_type: "dynamic" | "static" | "rest";
}> {
  await ensureWorkoutSettings(userId);
  const schedule = await ensureSchedule(userId);
  const weekday = isoDayOfWeek(date);
  const day = schedule.find((item) => item.day_of_week === weekday);
  const scheduledType = day?.workout_type ?? "rest";
  const existing = await getSessionByDate(userId, date);

  if (existing) {
    return { session: existing, scheduled_type: scheduledType };
  }

  if (scheduledType === "rest") {
    return { session: null, scheduled_type: scheduledType };
  }

  const macro = await getCurrentMacroState(userId);
  if (!macro.macro || !macro.phase) {
    return { session: null, scheduled_type: scheduledType };
  }

  const session = await createSession(userId, {
    session_date: date,
    workout_type: scheduledType,
    note: null,
  });

  return { session, scheduled_type: scheduledType };
}

export async function createSession(
  userId: string,
  input: CreateSessionInput,
): Promise<WorkoutSession> {
  const existing = await getSessionByDate(userId, input.session_date);
  if (existing) {
    throw new SessionConflictError();
  }

  const macro = await getCurrentMacroState(userId);
  if (!macro.macro || !macro.phase) {
    throw new NoCurrentPhaseError();
  }

  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      session_date: input.session_date,
      macro_cycle_id: macro.macro.id,
      phase_id: macro.phase.id,
      workout_type: input.workout_type,
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

  return mapWorkoutSession(inserted.data as Record<string, unknown>);
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
    macro_cycle_id: String(row.macro_cycle_id),
    phase_id: String(row.phase_id),
    workout_type: toWorkoutKind(row.workout_type),
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
