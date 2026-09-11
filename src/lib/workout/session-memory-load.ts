import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionPreviousWork, WorkoutSession } from "@/lib/types";
import { toSessionFeel } from "@/lib/workout/map-enums";
import { loadWorkBySession } from "@/lib/workout/session-log-load";
import { previousWorkFromSets } from "@/lib/workout/session-memory";

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
    .select("id, feel")
    .eq("user_id", userId)
    .eq("status", "completed")
    .eq("template_id", session.template_id)
    .neq("id", session.id)
    .lt("session_date", session.session_date)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previous.error) {
    throw previous.error;
  }
  if (!previous.data || typeof previous.data.id !== "string") {
    return found;
  }

  const grouped = await loadWorkBySession(userId, [previous.data.id]);
  const feel = toSessionFeel(previous.data.feel);
  for (const item of grouped.get(previous.data.id) ?? []) {
    const memory = previousWorkFromSets(item.sets, feel);
    if (memory) {
      found.set(item.exercise_id, memory);
    }
  }

  return found;
}
