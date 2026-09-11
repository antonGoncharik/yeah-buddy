import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail } from "@/lib/types";
import { mapWorkoutSet } from "@/lib/workout/map-rows";
import { getSessionDetail } from "@/lib/workout/session-detail";
import { withSessionRaiseOffers } from "@/lib/workout/session-raise-store";
import type {
  CompleteSessionInput,
  PatchSetInput,
} from "@/lib/workout/session-schema";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession, patchSession } from "@/lib/workout/sessions";
import { clearSkipTemplateIds } from "@/lib/workout/settings";

export async function patchWorkoutSet(
  userId: string,
  setId: string,
  input: PatchSetInput,
): Promise<SessionDetail | null> {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("id", setId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (!existing.data) {
    return null;
  }

  const current = mapWorkoutSet(existing.data as Record<string, unknown>);
  const next = {
    actual_weight:
      input.actual_weight === undefined
        ? current.actual_weight
        : input.actual_weight,
    actual_reps:
      input.actual_reps === undefined ? current.actual_reps : input.actual_reps,
    actual_seconds:
      input.actual_seconds === undefined
        ? current.actual_seconds
        : input.actual_seconds,
    is_completed:
      input.is_completed === undefined
        ? current.is_completed
        : input.is_completed,
  };

  if (next.is_completed) {
    next.actual_weight = next.actual_weight ?? current.planned_weight;
    next.actual_reps = next.actual_reps ?? current.planned_reps;
    next.actual_seconds = next.actual_seconds ?? current.planned_seconds;

    if (next.actual_weight == null || next.actual_weight <= 0) {
      throw new Error("Напиши фактический вес.");
    }
  }

  const updated = await supabase
    .from("workout_sets")
    .update(next)
    .eq("user_id", userId)
    .eq("id", setId)
    .select("*")
    .single();

  if (updated.error || !updated.data) {
    throw updated.error ?? new Error("Set update failed");
  }

  const sessionExercise = await supabase
    .from("session_exercises")
    .select("*")
    .eq("id", current.session_exercise_id)
    .eq("user_id", userId)
    .single();

  if (sessionExercise.error || !sessionExercise.data) {
    throw sessionExercise.error ?? new Error("Session exercise lookup failed");
  }

  const sessionId = String(sessionExercise.data.session_id);
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  return withSessionRaiseOffers(
    userId,
    await loadSessionDetail(userId, session),
  );
}

export async function completeSessionAsPlanned(
  userId: string,
  sessionId: string,
  input: CompleteSessionInput = {},
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  const detail = await getSessionDetail(userId, sessionId);
  if (!detail) {
    return null;
  }

  const overrides = new Map(
    (input.sets ?? []).map((set) => [set.id, set] as const),
  );
  const supabase = createSupabaseServerClient();

  for (const item of detail.exercises) {
    for (const set of item.sets) {
      const override = overrides.get(set.id);
      const actual_weight =
        override?.actual_weight !== undefined
          ? override.actual_weight
          : (set.actual_weight ?? set.planned_weight);
      const actual_reps =
        override?.actual_reps !== undefined
          ? override.actual_reps
          : (set.actual_reps ?? set.planned_reps);
      const actual_seconds =
        override?.actual_seconds !== undefined
          ? override.actual_seconds
          : (set.actual_seconds ?? set.planned_seconds);

      if (
        (actual_weight == null || actual_weight <= 0) &&
        set.planned_weight != null
      ) {
        throw new Error("Напиши фактический вес.");
      }

      const updated = await supabase
        .from("workout_sets")
        .update({
          actual_weight,
          actual_reps,
          actual_seconds,
          is_completed: true,
        })
        .eq("user_id", userId)
        .eq("id", set.id);

      if (updated.error) {
        throw updated.error;
      }
    }
  }

  await patchSession(userId, session.id, {
    status: "completed",
    note: input.note !== undefined ? input.note : undefined,
    feel: input.feel !== undefined ? input.feel : undefined,
  });
  await clearSkipTemplateIds(userId);
  const refreshed = await getSession(userId, sessionId);
  if (!refreshed) {
    return null;
  }
  return withSessionRaiseOffers(
    userId,
    await loadSessionDetail(userId, refreshed),
  );
}
