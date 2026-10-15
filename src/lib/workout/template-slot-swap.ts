import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/workout/sessions";

export const templateSlotSwapSchema = z.object({
  fromExerciseId: z.string().uuid(),
  exerciseId: z.string().uuid(),
});

/** Point the program slot at the exercise already swapped into today. */
export async function keepSwapInTemplate(
  userId: string,
  sessionId: string,
  fromExerciseId: string,
  toExerciseId: string,
): Promise<boolean> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return false;
  }
  if (!session.template_id) {
    throw new Error("У этой тренировки нет шаблона.");
  }
  if (fromExerciseId === toExerciseId) {
    return true;
  }

  const supabase = createSupabaseServerClient();
  const taken = await supabase
    .from("workout_template_exercises")
    .select("id")
    .eq("user_id", userId)
    .eq("template_id", session.template_id)
    .eq("exercise_id", toExerciseId)
    .maybeSingle();
  if (taken.error) {
    throw taken.error;
  }
  if (taken.data) {
    throw new Error("Это упражнение уже стоит в шаблоне.");
  }

  const updated = await supabase
    .from("workout_template_exercises")
    .update({ exercise_id: toExerciseId })
    .eq("user_id", userId)
    .eq("template_id", session.template_id)
    .eq("exercise_id", fromExerciseId)
    .select("id");
  if (updated.error) {
    throw updated.error;
  }
  if (!updated.data || updated.data.length === 0) {
    throw new Error("В шаблоне нет этого упражнения.");
  }

  return true;
}
