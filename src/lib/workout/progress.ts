import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ExerciseProgress,
  ProgressPoint,
  StrengthProgress,
} from "@/lib/types";
import { listExercises, mapGlobalMax } from "@/lib/workout/exercises";
import { PHASE_TYPE_LABELS } from "@/lib/workout/labels";
import {
  mapMacroCycle,
  mapPhaseMax,
  mapWorkoutPhase,
} from "@/lib/workout/macros";
import { percentChange } from "@/lib/workout/numbers";
import { listExerciseWorkPoints } from "@/lib/workout/session-log";

export async function getStrengthProgress(
  userId: string,
): Promise<StrengthProgress> {
  const exercises = await listExercises(userId, "active");
  const supabase = createSupabaseServerClient();
  const [macrosResult, phasesResult, maxesResult, globalsResult] =
    await Promise.all([
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
      phase_type: null,
      macro_number: null,
      label: record.achieved_at.slice(0, 10),
    });
    globalPoints.set(record.exercise_id, list);
  }

  const workByExercise = await listExerciseWorkPoints(userId);

  const progress: ExerciseProgress[] = exercises.map((exercise) => {
    const workPoints = workByExercise.get(exercise.id) ?? [];
    const phasePoints: ProgressPoint[] = [];
    for (const phase of phases) {
      const weight = latestByPhase.get(`${phase.id}:${exercise.id}`);
      if (weight == null) {
        continue;
      }
      const number = macroNumber.get(phase.macro_cycle_id) ?? null;
      phasePoints.push({
        date: phase.start_date,
        weight,
        phase_type: phase.phase_type,
        macro_number: number,
        label:
          number == null
            ? PHASE_TYPE_LABELS[phase.phase_type]
            : `№${number} · ${PHASE_TYPE_LABELS[phase.phase_type]}`,
      });
    }

    const fallback =
      phasePoints.length > 0
        ? phasePoints
        : (globalPoints.get(exercise.id) ?? []);
    const from_work = workPoints.length > 0;
    const points = from_work ? workPoints : fallback;
    const start_weight = points[0]?.weight ?? null;
    const current_weight = points.at(-1)?.weight ?? null;
    const delta =
      start_weight == null || current_weight == null
        ? null
        : current_weight - start_weight;
    const percent =
      start_weight == null || current_weight == null
        ? null
        : percentChange(start_weight, current_weight);

    return {
      exercise_id: exercise.id,
      name: exercise.short_name || exercise.name,
      category: exercise.category,
      current_weight,
      start_weight,
      delta,
      percent,
      points,
      from_work,
    };
  });

  progress.sort((left, right) => {
    const leftPercent = left.percent ?? -Infinity;
    const rightPercent = right.percent ?? -Infinity;
    if (rightPercent !== leftPercent) {
      return rightPercent - leftPercent;
    }
    return left.name.localeCompare(right.name, "ru");
  });

  const percents = progress.flatMap((item) =>
    item.percent == null ? [] : [item.percent],
  );

  return {
    exercises: progress,
    grown_count: progress.filter((item) => (item.delta ?? 0) > 0).length,
    avg_percent:
      percents.length === 0
        ? null
        : percents.reduce((sum, value) => sum + value, 0) / percents.length,
  };
}
