import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PhaseCircleProgress, WorkoutPhase } from "@/lib/types";
import { cycleDef, nextPhaseType } from "@/lib/workout/cycle";
import { phaseLabel } from "@/lib/workout/labels";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
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
    .eq("status", "completed")
    .not("template_id", "is", null);

  if (result.error) {
    throw result.error;
  }

  const settings = await ensureWorkoutSettings(userId);
  const cycle = settings.formulas.cycle;
  const next = nextPhaseType(phase.phase_type, cycle);
  const current = cycleDef(cycle, phase.phase_type);
  const completedCount = result.count ?? 0;
  return {
    phase_type: phase.phase_type,
    phase_name: phaseLabel(phase.phase_type, phase.name ?? current?.name),
    next_phase_type: next,
    next_phase_name: next
      ? phaseLabel(next, cycleDef(cycle, next)?.name)
      : null,
    last_in_cycle: next == null,
    increases_on_end: Boolean(current?.increase_on_end),
    completed_count: completedCount,
    circle_size: circleSize,
    suggest_end: completedCount >= circleSize,
  };
}
