import { z } from "zod";

import { isIsoDate } from "@/lib/days";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  SessionStatus,
  WorkoutKind,
  WorkoutSession,
  WorkoutSlot,
} from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { toNullableString } from "@/lib/workout/numbers";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import {
  isWorkoutSlot,
  kindFromSlot,
  nextSlotAfter,
} from "@/lib/workout/slots";

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
  slot: z.enum(["a", "b", "c", "static"]),
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
  next_slot: WorkoutSlot;
}> {
  await ensureWorkoutSettings(userId);
  const existing = await getSessionByDate(userId, date);
  const nextSlot = await getNextSlot(userId);

  return { session: existing, next_slot: nextSlot };
}

export async function getNextSlot(userId: string): Promise<WorkoutSlot> {
  const macro = await getCurrentMacroState(userId);
  if (!macro.phase) {
    return "a";
  }

  const supabase = createSupabaseServerClient();
  const last = await supabase
    .from("workout_sessions")
    .select("slot")
    .eq("user_id", userId)
    .eq("phase_id", macro.phase.id)
    .neq("status", "skipped")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last.error) {
    throw last.error;
  }

  if (!last.data) {
    return "a";
  }

  return nextSlotAfter(isWorkoutSlot(last.data.slot) ? last.data.slot : null);
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
      workout_type: kindFromSlot(input.slot),
      slot: input.slot,
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
