import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionPreviousWork, WorkoutSession } from "@/lib/types";
import { toSessionFeel } from "@/lib/workout/map-enums";
import { loadWorkBySession } from "@/lib/workout/session-log-load";
import {
  previousWorkFromSets,
  shouldHoldWeights,
} from "@/lib/workout/session-memory";

export async function loadPreviousWork(
  userId: string,
  session: WorkoutSession,
  exerciseIds: string[],
): Promise<Map<string, SessionPreviousWork>> {
  const found = new Map<string, SessionPreviousWork>();
  if (!session.template_id || exerciseIds.length === 0) {
    return found;
  }

  const supabase = createSupabaseServerClient();
  const previous = await supabase
    .from("workout_sessions")
    .select("id, feel, phase_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .eq("template_id", session.template_id)
    .neq("id", session.id)
    .lt("session_date", session.session_date)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2);

  if (previous.error) {
    throw previous.error;
  }

  const rows = previous.data ?? [];
  const latest = rows[0];
  if (!latest || typeof latest.id !== "string") {
    return found;
  }

  const feels = [...rows].reverse().map((row) => toSessionFeel(row.feel));
  const hold = shouldHoldWeights(feels);
  const latestPhase =
    typeof latest.phase_id === "string" ? latest.phase_id : null;
  const samePhase = latestPhase === session.phase_id;
  const grouped = await loadWorkBySession(userId, [latest.id]);
  const feel = toSessionFeel(latest.feel);
  for (const item of grouped.get(latest.id) ?? []) {
    const memory = previousWorkFromSets(item.sets, feel);
    if (memory) {
      found.set(item.exercise_id, { ...memory, same_phase: samePhase, hold });
    }
  }

  return found;
}
