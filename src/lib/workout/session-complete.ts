import { trackEvent } from "@/lib/analytics/track";
import { recordFunnelEvent } from "@/lib/funnel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail, WorkoutSession } from "@/lib/types";
import { cycleDrivesTracks } from "@/lib/workout/cycle";
import { refreshEstimateMaxesFromSession } from "@/lib/workout/estimate-max-refresh";
import { mapWorkoutSet } from "@/lib/workout/map-rows";
import { maybeAutoEndPhase } from "@/lib/workout/phase-auto-end";
import {
  resolveSetActuals,
  shouldSkipSetOnComplete,
  validateSessionBeforeComplete,
} from "@/lib/workout/session-complete-validate";
import { getSessionDetail } from "@/lib/workout/session-detail";
import { SessionLockedError } from "@/lib/workout/session-errors";
import { withSessionRaiseOffers } from "@/lib/workout/session-raise-store";
import type {
  CompleteSessionInput,
  PatchSetInput,
} from "@/lib/workout/session-schema";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession, patchSession } from "@/lib/workout/sessions";
import { completedSetWeight } from "@/lib/workout/set-log";
import {
  clearSkipTemplateIds,
  ensureWorkoutSettings,
} from "@/lib/workout/settings";
import { applyTrackProgressOnComplete } from "@/lib/workout/track-progress-apply";

export function sessionBlocksSetPatch(
  status: WorkoutSession["status"],
): boolean {
  return status === "completed";
}

export function shouldReturnCompletedSessionAsIs(
  status: WorkoutSession["status"],
  input: CompleteSessionInput,
): boolean {
  if (status !== "completed") {
    return false;
  }
  const hasSetOverrides = (input.sets?.length ?? 0) > 0;
  return (
    !hasSetOverrides && input.note === undefined && input.feel === undefined
  );
}

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
    actual_rir:
      input.actual_rir === undefined ? current.actual_rir : input.actual_rir,
    is_completed:
      input.is_completed === undefined
        ? current.is_completed
        : input.is_completed,
    logged: true,
  };

  const sessionExercise = await supabase
    .from("session_exercises")
    .select("session_id")
    .eq("id", current.session_exercise_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionExercise.error) {
    throw sessionExercise.error;
  }
  if (!sessionExercise.data) {
    return null;
  }

  const sessionId = String(sessionExercise.data.session_id);
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }
  if (sessionBlocksSetPatch(session.status)) {
    throw new SessionLockedError();
  }

  if (next.is_completed) {
    const weight = completedSetWeight({
      plannedWeight: current.planned_weight,
      typedWeight: next.actual_weight,
    });
    if (weight === "missing") {
      throw new Error("Напиши фактический вес.");
    }
    next.actual_weight = weight;
    next.actual_reps = next.actual_reps ?? current.planned_reps;
    next.actual_seconds = next.actual_seconds ?? current.planned_seconds;
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

  if (shouldReturnCompletedSessionAsIs(session.status, input)) {
    const existing = await loadSessionDetail(userId, session);
    if (!existing) {
      return null;
    }
    return withSessionRaiseOffers(userId, existing);
  }

  const detail = await getSessionDetail(userId, sessionId);
  if (!detail) {
    return null;
  }

  validateSessionBeforeComplete(detail, input);

  const overrides = new Map(
    (input.sets ?? []).map((set) => [set.id, set] as const),
  );
  const supabase = createSupabaseServerClient();

  for (const item of detail.exercises) {
    for (const set of item.sets) {
      const override = overrides.get(set.id);
      if (shouldSkipSetOnComplete(set, override)) {
        continue;
      }

      const { actual_weight, actual_reps, actual_seconds, actual_rir } =
        resolveSetActuals(set, override);

      const updated = await supabase
        .from("workout_sets")
        .update({
          actual_weight,
          actual_reps,
          actual_seconds,
          actual_rir,
          is_completed: true,
          logged: override !== undefined || set.logged,
        })
        .eq("user_id", userId)
        .eq("id", set.id);

      if (updated.error) {
        throw updated.error;
      }
    }
  }

  const firstCompletion = session.status !== "completed";
  await patchSession(userId, session.id, {
    status: "completed",
    note: input.note !== undefined ? input.note : undefined,
    feel: input.feel == null ? undefined : input.feel,
  });
  await clearSkipTemplateIds(userId);
  if (firstCompletion) {
    const settings = await ensureWorkoutSettings(userId);
    // Working kg grows after the session unless the week itself adds kilograms.
    if (!cycleDrivesTracks(settings.formulas.cycle)) {
      await applyTrackProgressOnComplete(userId, detail, input.feel);
    }
    await maybeAutoEndPhase(userId);
    await recordFunnelEvent(userId, "first_session");
    await trackEvent(userId, "workout_completed");
    const completed = await getSessionDetail(userId, sessionId);
    if (completed) {
      try {
        const { notifySessionPr } = await import("@/lib/telegram/pr-push");
        await notifySessionPr(userId, completed, session.session_date);
      } catch (error) {
        console.error(error);
      }
    }
  }

  const afterSets = await getSessionDetail(userId, sessionId);
  if (afterSets) {
    await refreshEstimateMaxesFromSession(userId, afterSets);
  }

  const refreshed = await getSession(userId, sessionId);
  if (!refreshed) {
    return null;
  }
  return withSessionRaiseOffers(
    userId,
    await loadSessionDetail(userId, refreshed),
  );
}
