import type { SessionDetail } from "@/lib/types";
import { StartingMaxLockedError } from "@/lib/workout/exercise-schema";
import { raiseGlobalMax } from "@/lib/workout/exercises";
import { listGlobalMaxes, pickCurrentMax } from "@/lib/workout/global-maxes";
import { sessionRaiseOffers } from "@/lib/workout/session-raise";
import { getSession } from "@/lib/workout/session-read";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export async function listSessionRaiseOffers(
  userId: string,
  detail: Pick<SessionDetail, "session" | "phase" | "exercises">,
): Promise<SessionDetail["raise_offers"]> {
  if (detail.session.status !== "completed" || detail.session.phase_id) {
    return [];
  }
  if (detail.session.feel === "miss") {
    return [];
  }

  const settings = await ensureWorkoutSettings(userId);
  const maxes = await listGlobalMaxes(
    userId,
    detail.exercises.map((item) => item.exercise_id),
  );
  const currentMaxByExercise = new Map(
    [...maxes.entries()].flatMap(([id, history]) => {
      const current = pickCurrentMax(history);
      return current ? [[id, current.max_weight] as const] : [];
    }),
  );

  return sessionRaiseOffers(
    detail,
    settings.max_increase_percent,
    currentMaxByExercise,
  );
}

export async function withSessionRaiseOffers(
  userId: string,
  detail: SessionDetail,
): Promise<SessionDetail> {
  return {
    ...detail,
    raise_offers: await listSessionRaiseOffers(userId, detail),
  };
}

export async function applySessionMaxRaises(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  const detail = await loadSessionDetail(userId, session);
  if (detail.session.status !== "completed") {
    throw new Error("Сначала закончи тренировку.");
  }

  if (detail.session.phase_id || detail.phase) {
    throw new StartingMaxLockedError();
  }

  const offers = await listSessionRaiseOffers(userId, detail);
  for (const offer of offers) {
    await raiseGlobalMax({
      userId,
      exerciseId: offer.exercise_id,
      maxWeight: offer.to_weight,
      achievedAt: detail.session.session_date,
      workoutSessionId: detail.session.id,
    });
  }

  const refreshed = await getSession(userId, sessionId);
  if (!refreshed) {
    return null;
  }

  return withSessionRaiseOffers(
    userId,
    await loadSessionDetail(userId, refreshed),
  );
}
