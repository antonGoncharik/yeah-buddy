import { z } from "zod";

import type { SessionDetail } from "@/lib/types";
import { saveExerciseTrack } from "@/lib/workout/exercise-tracks";
import {
  insertSessionExercise,
  loadPlanContext,
} from "@/lib/workout/session-plan";
import { withSessionRaiseOffers } from "@/lib/workout/session-raise-store";
import { getSession } from "@/lib/workout/session-read";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { slotFor } from "@/lib/workout/slot-plan";
import { getTemplate } from "@/lib/workout/templates";

export const sessionTracksSchema = z.object({
  tracks: z
    .array(
      z.object({
        exercise_id: z.string().uuid(),
        start_weight: z.number().finite().positive(),
      }),
    )
    .min(1),
});

export type SessionTracksInput = z.infer<typeof sessionTracksSchema>;

/**
 * Sets working kilograms for slots that use kg but have none yet and
 * adds those exercises to the planned session.
 */
export async function setSessionTracks(
  userId: string,
  sessionId: string,
  input: SessionTracksInput,
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
    detail.missing_tracks.map((item) => [item.id, item]),
  );
  const targets = input.tracks.flatMap((item) => {
    const exercise = missingById.get(item.exercise_id);
    return exercise ? [{ exercise, input: item }] : [];
  });
  if (targets.length === 0) {
    return withSessionRaiseOffers(userId, detail);
  }

  for (const target of targets) {
    await saveExerciseTrack(userId, target.exercise.id, {
      weight: target.input.start_weight,
    });
  }

  const template = session.template_id
    ? await getTemplate(userId, session.template_id)
    : null;
  const ctx = await loadPlanContext(userId, session, template);
  let sortOrder =
    Math.max(0, ...detail.exercises.map((item) => item.sort_order)) + 10;

  for (const target of targets) {
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
