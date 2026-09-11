import type { SessionDetail } from "@/lib/types";
import { ensureSessionPlan } from "@/lib/workout/session-plan";
import { loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession } from "@/lib/workout/sessions";

export async function getSessionDetail(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  await ensureSessionPlan(userId, session);
  return loadSessionDetail(userId, session);
}
