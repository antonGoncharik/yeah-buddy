import { listBodyWeights } from "@/lib/days";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProgressPoint, StrengthProgress } from "@/lib/types";
import { listExercises, mapGlobalMax } from "@/lib/workout/exercises";
import {
  mapMacroCycle,
  mapPhaseMax,
  mapWorkoutPhase,
} from "@/lib/workout/map-rows";
import {
  buildExerciseProgress,
  summarizeProgress,
} from "@/lib/workout/progress-build";
import { listExerciseWorkPoints } from "@/lib/workout/session-log";

export async function getStrengthProgress(
  userId: string,
): Promise<StrengthProgress> {
  const exercises = await listExercises(userId, "active");
  const supabase = createSupabaseServerClient();
  const [
    macrosResult,
    phasesResult,
    maxesResult,
    globalsResult,
    workByExercise,
    weights,
  ] = await Promise.all([
    supabase
      .from("macro_cycles")
      .select("*")
      .eq("user_id", userId)
      .order("number", { ascending: true }),
    supabase
      .from("workout_phases")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("phase_maxes")
      .select("*")
      .eq("user_id", userId)
      .order("set_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("global_maxes")
      .select("*")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: true })
      .order("created_at", { ascending: true }),
    listExerciseWorkPoints(userId),
    listBodyWeights(userId),
  ]);

  if (macrosResult.error) {
    throw macrosResult.error;
  }
  if (phasesResult.error) {
    throw phasesResult.error;
  }
  if (maxesResult.error) {
    throw maxesResult.error;
  }
  if (globalsResult.error) {
    throw globalsResult.error;
  }

  const macros = (macrosResult.data ?? []).map((row) =>
    mapMacroCycle(row as Record<string, unknown>),
  );
  const phases = (phasesResult.data ?? []).map((row) =>
    mapWorkoutPhase(row as Record<string, unknown>),
  );
  const macroNumber = new Map(macros.map((macro) => [macro.id, macro.number]));
  const latestByPhase = new Map<string, number>();
  for (const row of maxesResult.data ?? []) {
    const record = mapPhaseMax(row as Record<string, unknown>);
    const key = `${record.phase_id}:${record.exercise_id}`;
    if (!latestByPhase.has(key)) {
      latestByPhase.set(key, record.max_weight);
    }
  }

  const globalPoints = new Map<string, ProgressPoint[]>();
  for (const row of globalsResult.data ?? []) {
    const record = mapGlobalMax(row as Record<string, unknown>);
    const list = globalPoints.get(record.exercise_id) ?? [];
    list.push({
      date: record.achieved_at.slice(0, 10),
      weight: record.max_weight,
      seconds: null,
      tonnage: null,
      circle_tonnage: null,
      body_weight: null,
      relative: null,
      phase_type: null,
      macro_number: null,
      label: record.achieved_at.slice(0, 10),
    });
    globalPoints.set(record.exercise_id, list);
  }

  const progress = buildExerciseProgress({
    exercises,
    phases,
    latestByPhase,
    globalPoints,
    workByExercise,
    weights,
    macroNumber,
  });

  return {
    exercises: progress,
    ...summarizeProgress(progress),
  };
}
