import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MacroCycle, MacroGain, MacroRecap } from "@/lib/types";
import { recapEndPhaseKey } from "@/lib/workout/cycle";
import { phaseLabel } from "@/lib/workout/labels";
import {
  exerciseNamesById,
  latestWeightsByExercise,
} from "@/lib/workout/macro-maxes";
import { mapMacroCycle, mapWorkoutPhase } from "@/lib/workout/map-rows";
import { percentChange } from "@/lib/workout/numbers";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export async function getLatestCompletedMacroRecap(
  userId: string,
): Promise<MacroRecap | null> {
  const supabase = createSupabaseServerClient();
  const last = await supabase
    .from("macro_cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last.error) {
    throw last.error;
  }

  if (!last.data) {
    return null;
  }

  return getMacroRecap(
    userId,
    mapMacroCycle(last.data as Record<string, unknown>),
  );
}

export async function getMacroRecap(
  userId: string,
  macro: MacroCycle,
): Promise<MacroRecap | null> {
  const supabase = createSupabaseServerClient();
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
  const settings = await ensureWorkoutSettings(userId);
  const startPhase =
    phases.find((phase) => phase.sort_order === 1) ?? phases[0] ?? null;
  const endKey = recapEndPhaseKey(
    settings.formulas.cycle,
    phases.map((phase) => phase.phase_type),
  );
  const endPhase =
    phases.find((phase) => phase.phase_type === endKey) ??
    phases.find((phase) => phase.phase_type === "peak") ??
    phases.find((phase) => phase.phase_type === "volume") ??
    startPhase;

  if (!startPhase || !endPhase) {
    return null;
  }

  const [startWeights, endWeights] = await Promise.all([
    latestWeightsByExercise(userId, startPhase.id),
    latestWeightsByExercise(userId, endPhase.id),
  ]);
  const exerciseIds = [
    ...new Set([...startWeights.keys(), ...endWeights.keys()]),
  ];
  const names = await exerciseNamesById(userId, exerciseIds);
  const gains: MacroGain[] = [];

  for (const exerciseId of exerciseIds) {
    const startWeight = startWeights.get(exerciseId);
    const endWeight = endWeights.get(exerciseId) ?? startWeight;
    if (startWeight == null || endWeight == null) {
      continue;
    }

    const percent = percentChange(startWeight, endWeight);
    gains.push({
      exercise_id: exerciseId,
      name: names.get(exerciseId) ?? "Упражнение",
      start_weight: startWeight,
      end_weight: endWeight,
      delta: endWeight - startWeight,
      percent,
    });
  }

  if (gains.length === 0) {
    return null;
  }

  gains.sort((left, right) => {
    const leftPercent = left.percent ?? -Infinity;
    const rightPercent = right.percent ?? -Infinity;
    if (rightPercent !== leftPercent) {
      return rightPercent - leftPercent;
    }
    return left.name.localeCompare(right.name, "ru");
  });

  const percents = gains.flatMap((gain) =>
    gain.percent == null ? [] : [gain.percent],
  );
  const avg_percent =
    percents.length === 0
      ? null
      : percents.reduce((sum, value) => sum + value, 0) / percents.length;

  return {
    macro_id: macro.id,
    number: macro.number,
    start_date: macro.start_date,
    end_date: macro.end_date,
    from_phase: startPhase.phase_type,
    to_phase: endPhase.phase_type,
    from_name: phaseLabel(startPhase.phase_type, startPhase.name),
    to_name: phaseLabel(endPhase.phase_type, endPhase.name),
    gains,
    grown_count: gains.filter((gain) => gain.delta > 0).length,
    avg_percent,
  };
}
