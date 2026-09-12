import { getUserCalendarToday } from "@/lib/day/writable";
import { assertSameIds, orderRanks } from "@/lib/order";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail } from "@/lib/types";
import { ensureSessionPlan } from "@/lib/workout/session-plan";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession, getSessionOnDate } from "@/lib/workout/sessions";

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
  return loadSessionDetail(userId, session);
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
  await rebuildPlannedSession(userId, session.id);
}
