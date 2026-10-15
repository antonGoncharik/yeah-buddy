import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MuscleId, SessionDetail } from "@/lib/types";
import { loadExerciseMuscleMeta } from "@/lib/workout/muscle-load";
import { resolveExerciseMuscleWeights } from "@/lib/workout/muscle-resolve";
import { primaryMuscle } from "@/lib/workout/session-swap";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession } from "@/lib/workout/sessions";
import { sorePlannedWeight } from "@/lib/workout/sore";

export async function easeSoreSession(
  userId: string,
  sessionId: string,
  muscles: readonly MuscleId[],
): Promise<
  | (SessionDetail & {
      easedSets: number;
    })
  | null
> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }
  if (session.status !== "planned" || muscles.length === 0) {
    const detail = await loadSessionDetail(userId, session);
    return { ...detail, easedSets: 0 };
  }

  const supabase = createSupabaseServerClient();
  const loaded = await supabase
    .from("session_exercises")
    .select(
      "exercise_id, exercises(weight_step), workout_sets(id, planned_weight, is_completed)",
    )
    .eq("user_id", userId)
    .eq("session_id", sessionId);
  if (loaded.error) {
    throw loaded.error;
  }

  const ids = (loaded.data ?? []).flatMap((row) =>
    typeof row.exercise_id === "string" ? [row.exercise_id] : [],
  );
  const meta = await loadExerciseMuscleMeta(userId, ids);
  const wanted = new Set(muscles);
  let easedSets = 0;

  for (const row of loaded.data ?? []) {
    if (typeof row.exercise_id !== "string") {
      continue;
    }
    const info = meta.get(row.exercise_id);
    if (!info) {
      continue;
    }
    const muscle = primaryMuscle(resolveExerciseMuscleWeights(info));
    if (!muscle || !wanted.has(muscle)) {
      continue;
    }
    const exercise = firstRecord(row.exercises);
    const step = Number(exercise?.weight_step);
    const sets = Array.isArray(row.workout_sets) ? row.workout_sets : [];
    for (const set of sets) {
      if (
        !isRecord(set) ||
        set.is_completed === true ||
        typeof set.id !== "string"
      ) {
        continue;
      }
      const weight = Number(set.planned_weight);
      if (!(weight > 0)) {
        continue;
      }
      const next = sorePlannedWeight(weight, Number.isFinite(step) ? step : 0);
      if (next === weight) {
        continue;
      }
      const updated = await supabase
        .from("workout_sets")
        .update({ planned_weight: next })
        .eq("user_id", userId)
        .eq("id", set.id);
      if (updated.error) {
        throw updated.error;
      }
      easedSets += 1;
    }
  }

  const detail = await loadSessionDetail(userId, session);
  return { ...detail, easedSets };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return isRecord(value[0]) ? value[0] : null;
  }
  return isRecord(value) ? value : null;
}
