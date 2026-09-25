import { getUserCalendarToday } from "@/lib/day/writable";
import { assertSameIds, orderRanks } from "@/lib/order";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail, SessionStatus, WorkoutSession } from "@/lib/types";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import { mapWorkoutSession } from "@/lib/workout/map-rows";
import { ensureSessionPlan } from "@/lib/workout/session-plan";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession, getSessionOnDate } from "@/lib/workout/sessions";

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
