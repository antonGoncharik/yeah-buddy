import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentMacroState, PhaseMax } from "@/lib/types";
import { listPhaseMaxRows } from "@/lib/workout/macro-maxes";
import { getLatestCompletedMacroRecap } from "@/lib/workout/macro-recap";
import { mapMacroCycle, mapWorkoutPhase } from "@/lib/workout/map-rows";
import { getPhaseCircleProgress } from "@/lib/workout/phase-progress";

export async function getCurrentMacroState(
  userId: string,
): Promise<CurrentMacroState> {
  const supabase = createSupabaseServerClient();
  const macros = await supabase
    .from("macro_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "current")
    .maybeSingle();

  if (macros.error) {
    throw macros.error;
  }

  if (!macros.data) {
    return {
      macro: null,
      phase: null,
      phases: [],
      maxes: [],
      phase_circle: null,
      last_recap: await getLatestCompletedMacroRecap(userId),
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
  const maxes = phase ? await listPhaseMaxRows(userId, phase.id) : [];
  const phase_circle = await getPhaseCircleProgress(userId, phase);
  const last_recap = await getLatestCompletedMacroRecap(userId);

  return { macro, phase, phases, maxes, phase_circle, last_recap };
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
