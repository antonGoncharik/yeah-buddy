import { z } from "zod";

import type { SessionDetail } from "@/lib/types";
import { correctStartingMax } from "@/lib/workout/global-maxes";
import { setPhaseMax } from "@/lib/workout/macro-maxes";
import {
  insertSessionExercise,
  loadPlanContext,
} from "@/lib/workout/session-plan";
import { withSessionRaiseOffers } from "@/lib/workout/session-raise-store";
import { getSession } from "@/lib/workout/session-read";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { slotFor } from "@/lib/workout/slot-plan";
import { getTemplate } from "@/lib/workout/templates";

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
 * Sets 1ПМ for exercises that were left out of a planned session and adds
 * them to the plan. Inside a cycle the number becomes a phase max; outside
 * it corrects the starting 1ПМ.
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
  }

  const template = session.template_id
    ? await getTemplate(userId, session.template_id)
    : null;
  const ctx = await loadPlanContext(userId, session, template);
  let sortOrder =
    Math.max(0, ...detail.exercises.map((item) => item.sort_order)) + 10;

  for (const target of targets) {
    ctx.maxByExercise.set(target.exercise.id, target.maxWeight);
    const inserted = await insertSessionExercise(
      userId,
      session,
      target.exercise,
      slotFor(template?.slots, target.exercise.id),
      sortOrder,
      ctx,
    );
    if (inserted) {
      sortOrder += 10;
    }
  }

  return withSessionRaiseOffers(
    userId,
    await loadSessionDetail(userId, session),
  );
}
