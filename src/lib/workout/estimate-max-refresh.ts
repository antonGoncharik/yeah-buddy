import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail } from "@/lib/types";
import { e1rmFromWorkSet } from "@/lib/workout/e1rm";
import { floorToStep } from "@/lib/workout/formulas";
import { listGlobalMaxes, pickCurrentMax } from "@/lib/workout/global-maxes";

/** Raise estimate-sourced 1RM in place when the session e1RM beats the stored max. */
export async function refreshEstimateMaxesFromSession(
  userId: string,
  detail: SessionDetail,
): Promise<void> {
  if (detail.session.phase_id || detail.phase) {
    return;
  }
  if (detail.session.feel === "miss") {
    return;
  }

  const exerciseIds = detail.exercises.map((item) => item.exercise_id);
  const maxes = await listGlobalMaxes(userId, exerciseIds);
  const supabase = createSupabaseServerClient();

  for (const item of detail.exercises) {
    const current = pickCurrentMax(maxes.get(item.exercise_id) ?? []);
    if (current?.source !== "estimate") {
      continue;
    }

    let best: number | null = null;
    for (const set of item.sets) {
      const e1 = e1rmFromWorkSet(set);
      if (e1 == null) {
        continue;
      }
      if (best == null || e1 > best) {
        best = e1;
      }
    }
    if (best == null) {
      continue;
    }

    const step =
      item.exercise.weight_step > 0 ? item.exercise.weight_step : 2.5;
    const next = floorToStep(best, step);
    if (next <= current.max_weight) {
      continue;
    }

    const updated = await supabase
      .from("global_maxes")
      .update({ max_weight: next })
      .eq("user_id", userId)
      .eq("id", current.id);

    if (updated.error) {
      throw updated.error;
    }
  }
}
