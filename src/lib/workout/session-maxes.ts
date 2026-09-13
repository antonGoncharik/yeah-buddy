import { z } from "zod";

import type { SessionDetail } from "@/lib/types";
import { correctStartingMax } from "@/lib/workout/global-maxes";
import { setPhaseMax } from "@/lib/workout/macro-maxes";
import { insertSessionExercise } from "@/lib/workout/session-plan";
import { withSessionRaiseOffers } from "@/lib/workout/session-raise-store";
import { getSession } from "@/lib/workout/session-read";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export const sessionMaxesSchema = z.object({
  maxes: z
    .array(
      z.object({
        exercise_id: z.string().uuid(),
        max_weight: z.number().finite().positive(),
      }),
    )
    .min(1),
});

export type SessionMaxesInput = z.infer<typeof sessionMaxesSchema>;

/**
 * Sets working weights for exercises that were left out of a planned session
 * and adds them to the plan. Inside a cycle the weight becomes a phase max;
 * outside it corrects the starting weight.
 */
export async function setSessionMaxes(
  userId: string,
  sessionId: string,
  input: SessionMaxesInput,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  if (session.status !== "planned") {
    throw new Error("Тренировка уже закончена.");
  }

  const detail = await loadSessionDetail(userId, session);
  const missingById = new Map(
    detail.missing_maxes.map((item) => [item.id, item]),
  );
  const targets = input.maxes.flatMap((item) => {
    const exercise = missingById.get(item.exercise_id);
    return exercise ? [{ exercise, maxWeight: item.max_weight }] : [];
  });
  if (targets.length === 0) {
    return withSessionRaiseOffers(userId, detail);
  }

  const settings = await ensureWorkoutSettings(userId);
  let sortOrder =
    Math.max(0, ...detail.exercises.map((item) => item.sort_order)) + 10;

  for (const target of targets) {
    if (session.phase_id) {
      await setPhaseMax(userId, session.phase_id, {
        exercise_id: target.exercise.id,
        max_weight: target.maxWeight,
      });
    } else {
      await correctStartingMax({
        userId,
        exerciseId: target.exercise.id,
        maxWeight: target.maxWeight,
      });
    }

    await insertSessionExercise(
      userId,
      session,
      target.exercise,
      target.maxWeight,
      sortOrder,
      settings.formulas,
    );
    sortOrder += 10;
  }

  return withSessionRaiseOffers(
    userId,
    await loadSessionDetail(userId, session),
  );
}
