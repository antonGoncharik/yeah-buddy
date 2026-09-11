import { markDateAsTrainingIfExists } from "@/lib/days";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkoutKind, WorkoutSession } from "@/lib/types";
import { listExercises } from "@/lib/workout/exercises";
import { templateHasPlanMaxes } from "@/lib/workout/hints";
import { getCurrentMacroState } from "@/lib/workout/macros";
import { mapWorkoutSession } from "@/lib/workout/map-rows";
import { toNullableString } from "@/lib/workout/numbers";
import {
  type CreateSessionInput,
  type PatchSessionInput,
  SessionConflictError,
  SessionLockedError,
  SessionNeedsMaxesError,
} from "@/lib/workout/session-errors";
import { getSession, getSessionOnDate } from "@/lib/workout/session-read";
import { getTemplate, TemplateNotFoundError } from "@/lib/workout/templates";

interface InsertSessionInput {
  session_date: string;
  workout_type: WorkoutKind;
  template_id: string | null;
  macro_cycle_id: string | null;
  phase_id: string | null;
  note: string | null;
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
  input: InsertSessionInput,
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
      feel: input.feel === undefined ? current.feel : input.feel,
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
