import { getUserCalendarToday } from "@/lib/day/writable";
import { assertSameIds, orderRanks } from "@/lib/order";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail, SessionStatus, WorkoutSession } from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import { mapWorkoutSession } from "@/lib/workout/map-rows";
import { adHocFeelPlan, resolveAdHocKind } from "@/lib/workout/session-add";
import {
  ensureSessionPlan,
  insertSessionExercise,
  loadPlanContext,
} from "@/lib/workout/session-plan";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession, getSessionOnDate } from "@/lib/workout/sessions";
import { slotFor } from "@/lib/workout/slot-plan";
import { getTemplate } from "@/lib/workout/templates";

/**
 * A planned session with nothing logged yet follows the phase that is
 * current now. Logged sets stay on the phase they were started under.
 */
export function plannedSessionPhaseTarget(input: {
  status: SessionStatus;
  phaseId: string | null;
  macroId: string | null;
  hasLoggedSets: boolean;
  currentPhaseId: string | null;
  currentMacroId: string | null;
}): { phaseId: string | null; macroId: string | null } | null {
  if (input.status !== "planned" || input.hasLoggedSets) {
    return null;
  }
  if (
    input.phaseId === input.currentPhaseId &&
    input.macroId === input.currentMacroId
  ) {
    return null;
  }
  return {
    phaseId: input.currentPhaseId,
    macroId: input.currentMacroId,
  };
}

export async function removeSessionExercise(
  userId: string,
  sessionId: string,
  sessionExerciseId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  const detail = await loadSessionDetail(userId, session);
  const target = detail.exercises.find((item) => item.id === sessionExerciseId);
  if (!target) {
    throw new Error("Упражнение не найдено в тренировке.");
  }

  if (target.sets.some((set) => set.is_completed)) {
    throw new Error("Нельзя убрать упражнение с выполненными подходами.");
  }

  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("session_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("id", sessionExerciseId)
    .eq("session_id", sessionId);

  if (deleted.error) {
    throw deleted.error;
  }

  return loadSessionDetail(userId, session);
}

export async function reorderSessionExercises(
  userId: string,
  sessionId: string,
  exerciseIds: string[],
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  const detail = await loadSessionDetail(userId, session);
  assertSameIds(
    detail.exercises.map((item) => item.id),
    exerciseIds,
  );

  const supabase = createSupabaseServerClient();
  const updated = await Promise.all(
    orderRanks(exerciseIds).map((rank) =>
      supabase
        .from("session_exercises")
        .update({ sort_order: rank.sort_order })
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .eq("id", rank.id),
    ),
  );

  const failed = updated.find((result) => result.error);
  if (failed?.error) {
    throw failed.error;
  }

  return loadSessionDetail(userId, session);
}

export async function rebuildPlannedSession(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (session?.status !== "planned") {
    return session ? loadSessionDetail(userId, session) : null;
  }

  const detail = await loadSessionDetail(userId, session);
  if (
    detail.exercises.some((item) => item.sets.some((set) => set.is_completed))
  ) {
    return detail;
  }

  const previousExerciseIds = detail.exercises.map((item) => item.exercise_id);

  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("session_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("session_id", sessionId);

  if (deleted.error) {
    throw deleted.error;
  }

  await ensureSessionPlan(userId, session);
  const rebuilt = await loadSessionDetail(userId, session);
  const nextIds = preserveSessionExerciseIds(
    previousExerciseIds,
    rebuilt.exercises,
  );
  if (
    nextIds.length > 1 &&
    nextIds.some((id, index) => rebuilt.exercises[index]?.id !== id)
  ) {
    return reorderSessionExercises(userId, sessionId, nextIds);
  }
  return rebuilt;
}

function preserveSessionExerciseIds(
  previousExerciseIds: string[],
  exercises: Array<{ id: string; exercise_id: string }>,
): string[] {
  const remaining = [...exercises];
  const ordered: string[] = [];
  for (const exerciseId of previousExerciseIds) {
    const index = remaining.findIndex(
      (item) => item.exercise_id === exerciseId,
    );
    if (index < 0) {
      continue;
    }
    const [row] = remaining.splice(index, 1);
    if (row) {
      ordered.push(row.id);
    }
  }
  ordered.push(...remaining.map((item) => item.id));
  return ordered;
}

async function retargetPlannedSessionPhase(
  userId: string,
  session: WorkoutSession,
): Promise<WorkoutSession> {
  const macro = await getCurrentMacroState(userId);
  const currentPhaseId = macro.phase?.id ?? null;
  const currentMacroId = macro.macro?.id ?? null;
  if (
    !plannedSessionPhaseTarget({
      status: session.status,
      phaseId: session.phase_id,
      macroId: session.macro_cycle_id,
      hasLoggedSets: false,
      currentPhaseId,
      currentMacroId,
    })
  ) {
    return session;
  }

  const detail = await loadSessionDetail(userId, session);
  const hasLoggedSets = detail.exercises.some((item) =>
    item.sets.some((set) => set.is_completed),
  );
  const target = plannedSessionPhaseTarget({
    status: session.status,
    phaseId: session.phase_id,
    macroId: session.macro_cycle_id,
    hasLoggedSets,
    currentPhaseId,
    currentMacroId,
  });
  if (!target) {
    return session;
  }

  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("workout_sessions")
    .update({
      phase_id: target.phaseId,
      macro_cycle_id: target.macroId,
    })
    .eq("user_id", userId)
    .eq("id", session.id)
    .eq("status", "planned")
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }
  if (!updated.data) {
    return session;
  }
  return mapWorkoutSession(updated.data as Record<string, unknown>);
}

/** Template order, minus exercises already in the session. */
export function templateExercisesToAdd(
  sessionExerciseIds: readonly string[],
  templateExerciseIds: readonly string[],
): string[] {
  const present = new Set(sessionExerciseIds);
  return templateExerciseIds.filter((id) => !present.has(id));
}

/**
 * Today's open workout follows its template. Nothing logged yet — rebuild.
 * Already started — append exercises added to the template, leave logs alone.
 */
export async function syncTodaysSessionTemplate(
  userId: string,
  templateId: string,
): Promise<void> {
  const session = await getSessionOnDate(
    userId,
    await getUserCalendarToday(userId),
  );
  if (
    !session ||
    session.template_id !== templateId ||
    session.status !== "planned"
  ) {
    return;
  }

  const detail = await loadSessionDetail(userId, session);
  const logged = detail.exercises.some((item) =>
    item.sets.some((set) => set.is_completed),
  );
  if (!logged) {
    await rebuildPlannedSession(userId, session.id);
    return;
  }

  const template = await getTemplate(userId, templateId);
  if (!template) {
    return;
  }

  const missingIds = templateExercisesToAdd(
    detail.exercises.map((item) => item.exercise_id),
    template.exercises.map((exercise) => exercise.id),
  );
  if (missingIds.length === 0) {
    return;
  }

  const ctx = await loadPlanContext(userId, session, template);
  let sort = Math.max(0, ...detail.exercises.map((item) => item.sort_order));
  for (const exerciseId of missingIds) {
    const exercise = template.exercises.find((item) => item.id === exerciseId);
    if (!exercise) {
      continue;
    }
    sort += 10;
    const plan = slotFor(template.slots, exercise.id);
    const inserted = await insertSessionExercise(
      userId,
      session,
      exercise,
      plan,
      sort,
      ctx,
    );
    if (inserted) {
      continue;
    }
    await insertSessionExercise(
      userId,
      session,
      exercise,
      adHocFeelPlan(
        resolveAdHocKind(exercise.workout_type, session.workout_type),
      ),
      sort,
      ctx,
    );
  }
}

export async function rebuildTodaysPlannedSession(
  userId: string,
): Promise<void> {
  const session = await getSessionOnDate(
    userId,
    await getUserCalendarToday(userId),
  );
  if (!session) {
    return;
  }
  const aligned = await retargetPlannedSessionPhase(userId, session);
  await rebuildPlannedSession(userId, aligned.id);
}
