import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail } from "@/lib/types";
import { nextWorkSetPlan } from "@/lib/workout/session-set-add";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession } from "@/lib/workout/sessions";

export async function appendSessionWorkSet(
  userId: string,
  sessionId: string,
  sessionExerciseId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }
  if (session.status !== "planned") {
    throw new Error("Подход можно добавить только в открытой тренировке.");
  }

  const supabase = createSupabaseServerClient();
  const owned = await supabase
    .from("session_exercises")
    .select("id")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .eq("id", sessionExerciseId)
    .maybeSingle();
  if (owned.error) {
    throw owned.error;
  }
  if (!owned.data) {
    throw new Error("Упражнение не найдено в тренировке.");
  }

  const existing = await supabase
    .from("workout_sets")
    .select(
      "set_type, set_number, planned_weight, planned_reps, planned_reps_to, planned_seconds, planned_rir",
    )
    .eq("user_id", userId)
    .eq("session_exercise_id", sessionExerciseId);
  if (existing.error) {
    throw existing.error;
  }

  const plan = nextWorkSetPlan(existing.data ?? []);
  if (!plan) {
    throw new Error("Нет рабочего подхода, который можно повторить.");
  }

  const inserted = await supabase.from("workout_sets").insert({
    user_id: userId,
    session_exercise_id: sessionExerciseId,
    set_type: plan.set_type,
    set_number: plan.set_number,
    planned_weight: plan.planned_weight,
    planned_reps: plan.planned_reps,
    planned_reps_to: plan.planned_reps_to,
    planned_seconds: plan.planned_seconds,
    planned_rir: plan.planned_rir,
  });
  if (inserted.error) {
    throw inserted.error;
  }

  return loadSessionDetail(userId, session);
}
