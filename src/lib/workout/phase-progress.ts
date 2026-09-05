import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PhaseCircleProgress, WorkoutPhase } from "@/lib/types";
import { listActiveTemplates } from "@/lib/workout/templates";

export async function getPhaseCircleProgress(
  userId: string,
  phase: WorkoutPhase | null,
): Promise<PhaseCircleProgress | null> {
  if (!phase) {
    return null;
  }

  const active = await listActiveTemplates(userId);
  const circleSize = active.length;
  if (circleSize === 0) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("phase_id", phase.id)
    .eq("status", "completed");

  if (result.error) {
    throw result.error;
  }

  const completedCount = result.count ?? 0;
  return {
    phase_type: phase.phase_type,
    completed_count: completedCount,
    circle_size: circleSize,
    suggest_end: completedCount >= circleSize,
  };
}
