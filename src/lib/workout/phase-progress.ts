import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PhaseCircleProgress, WorkoutPhase } from "@/lib/types";
import { phaseOpenedItself } from "@/lib/workout/beats";
import { cycleDef, nextPhaseType } from "@/lib/workout/cycle";
import { phaseLabel } from "@/lib/workout/labels";
import { toSessionFeel } from "@/lib/workout/map-enums";
import { mapWorkoutPhase } from "@/lib/workout/map-rows";
import { shouldHoldWeights } from "@/lib/workout/session-memory";
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
    .select("feel")
    .eq("user_id", userId)
    .eq("phase_id", phase.id)
    .eq("status", "completed")
    .not("template_id", "is", null)
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  const settings = await ensureWorkoutSettings(userId);
  const cycle = settings.formulas.cycle;
  const loop = settings.formulas.cycle_loop === true;
  const next = nextPhaseType(phase.phase_type, cycle, loop);
  const current = cycleDef(cycle, phase.phase_type);
  const feels = (result.data ?? []).map((row) => toSessionFeel(row.feel));
  const completedCount = feels.length;
  const openedItself = await circleOpenedItself(
    userId,
    phase,
    completedCount,
    circleSize,
    settings.formulas.cycle_auto_end === true,
    cycle,
    loop,
  );
  return {
    phase_type: phase.phase_type,
    phase_name: phaseLabel(phase.phase_type, phase.name ?? current?.name),
    next_phase_type: next,
    next_phase_name: next
      ? phaseLabel(next, cycleDef(cycle, next)?.name)
      : null,
    last_in_cycle: next == null,
    increases_on_end: Boolean(current?.increase_on_end),
    kg_increase_on_end: current?.kg_increase_on_end ?? null,
    hold_weights: shouldHoldWeights(feels),
    completed_count: completedCount,
    circle_size: circleSize,
    suggest_end: completedCount >= circleSize,
    opened_itself: openedItself,
  };
}

async function circleOpenedItself(
  userId: string,
  phase: WorkoutPhase,
  completedCount: number,
  circleSize: number,
  autoEnd: boolean,
  cycle: Parameters<typeof cycleDef>[0],
  loop: boolean,
): Promise<boolean> {
  if (completedCount !== 0 || !autoEnd) {
    return false;
  }

  const previous = await previousPhase(userId, phase);
  if (!previous) {
    return false;
  }

  const previousNext = nextPhaseType(previous.phase_type, cycle, loop);
  const previousDef = cycleDef(cycle, previous.phase_type);
  return phaseOpenedItself({
    autoEnd,
    completedCount,
    circleSize,
    previousCount: await countPhaseSessions(userId, previous.id),
    previousLast: previousNext == null,
    previousIncreases: Boolean(previousDef?.increase_on_end),
  });
}

async function previousPhase(
  userId: string,
  phase: WorkoutPhase,
): Promise<WorkoutPhase | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("macro_cycle_id", phase.macro_cycle_id)
    .eq("status", "completed")
    .lt("sort_order", phase.sort_order)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }
  if (!result.data) {
    return null;
  }
  return mapWorkoutPhase(result.data as Record<string, unknown>);
}

async function countPhaseSessions(
  userId: string,
  phaseId: string,
): Promise<number> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("phase_id", phaseId)
    .eq("status", "completed")
    .not("template_id", "is", null);

  if (result.error) {
    throw result.error;
  }
  return result.count ?? 0;
}
