import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionDetail } from "@/lib/types";
import { loadExerciseMuscleMeta } from "@/lib/workout/muscle-load";
import { resolveExerciseMuscleWeights } from "@/lib/workout/muscle-resolve";
import { shortSessionPlan } from "@/lib/workout/session-short";
import { primaryMuscle } from "@/lib/workout/session-swap";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession } from "@/lib/workout/sessions";

export async function shortenSession(
  userId: string,
  sessionId: string,
): Promise<
  | (SessionDetail & {
      shortPairs: Array<[string, string]>;
      droppedSets: number;
    })
  | null
> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }
  if (session.status !== "planned") {
    throw new Error("Ужать можно только открытую тренировку.");
  }

  const detail = await loadSessionDetail(userId, session);
  const ids = detail.exercises.map((item) => item.exercise_id);
  const meta = await loadExerciseMuscleMeta(userId, ids);
  const plan = shortSessionPlan(
    detail.exercises.map((item) => {
      const info = meta.get(item.exercise_id);
      const muscle = info
        ? primaryMuscle(resolveExerciseMuscleWeights(info))
        : null;
      return {
        id: item.id,
        muscle,
        sets: item.sets.map((set) => ({
          id: set.id,
          set_type: set.set_type,
          set_number: set.set_number,
          is_completed: set.is_completed,
        })),
      };
    }),
  );

  const supabase = createSupabaseServerClient();
  if (plan.dropSetIds.length > 0) {
    const removed = await supabase
      .from("workout_sets")
      .delete()
      .eq("user_id", userId)
      .in("id", plan.dropSetIds);
    if (removed.error) {
      throw removed.error;
    }
  }

  for (const exercise of detail.exercises) {
    const remaining = exercise.sets
      .filter((set) => !plan.dropSetIds.includes(set.id))
      .slice()
      .sort((left, right) => left.set_number - right.set_number);
    for (let index = 0; index < remaining.length; index += 1) {
      const setNumber = index + 1;
      if (remaining[index].set_number === setNumber) {
        continue;
      }
      const updated = await supabase
        .from("workout_sets")
        .update({ set_number: setNumber })
        .eq("user_id", userId)
        .eq("id", remaining[index].id);
      if (updated.error) {
        throw updated.error;
      }
    }
  }

  const next = await loadSessionDetail(userId, session);
  return {
    ...next,
    shortPairs: plan.pairs,
    droppedSets: plan.dropSetIds.length,
  };
}
