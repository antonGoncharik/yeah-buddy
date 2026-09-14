import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentMacroState, PhaseMax } from "@/lib/types";
import { listPhaseMaxRows } from "@/lib/workout/macro-maxes";
import { getLatestCompletedMacroRecap } from "@/lib/workout/macro-recap";
import { mapMacroCycle, mapWorkoutPhase } from "@/lib/workout/map-rows";
import { getPhaseCircleProgress } from "@/lib/workout/phase-progress";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export async function getCurrentMacroState(
  userId: string,
): Promise<CurrentMacroState> {
  const supabase = createSupabaseServerClient();
  const [macros, settings, last_recap] = await Promise.all([
    supabase
      .from("macro_cycles")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "current")
      .maybeSingle(),
    ensureWorkoutSettings(userId),
    getLatestCompletedMacroRecap(userId),
  ]);

  if (macros.error) {
    throw macros.error;
  }

  const planned_cycle = settings.formulas.cycle.map((phase) => ({
    key: phase.key,
    name: phase.name,
  }));

  if (!macros.data) {
    return {
      macro: null,
      phase: null,
      phases: [],
      maxes: [],
      planned_cycle,
      phase_circle: null,
      last_recap,
    };
  }

  const macro = mapMacroCycle(macros.data as Record<string, unknown>);
  const phasesResult = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("macro_cycle_id", macro.id)
    .order("sort_order", { ascending: true });

  if (phasesResult.error) {
    throw phasesResult.error;
  }

  const phases = (phasesResult.data ?? []).map((row) =>
    mapWorkoutPhase(row as Record<string, unknown>),
  );
  const phase = phases.find((item) => item.status === "current") ?? null;
  const [maxes, phase_circle] = await Promise.all([
    phase ? listPhaseMaxRows(userId, phase.id) : [],
    getPhaseCircleProgress(userId, phase),
  ]);

  return {
    macro,
    phase,
    phases,
    maxes,
    planned_cycle,
    phase_circle,
    last_recap,
  };
}

export async function listCurrentPhaseMaxes(
  userId: string,
  phaseId: string,
): Promise<Map<string, PhaseMax>> {
  const rows = await listPhaseMaxRows(userId, phaseId);
  return new Map(
    rows.flatMap((row) =>
      row.phase_max ? [[row.exercise.id, row.phase_max] as const] : [],
    ),
  );
}
