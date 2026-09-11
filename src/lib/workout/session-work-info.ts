import type { WorkoutSession } from "@/lib/types";
import {
  firstWorkPlanScore,
  formatWorkSummary,
} from "@/lib/workout/session-format";
import { loadWorkBySession } from "@/lib/workout/session-log-load";

export interface SessionWorkInfo {
  summary: string | null;
  plan_hit: number;
  plan_total: number;
}

export async function listSessionWorkInfo(
  userId: string,
  sessions: WorkoutSession[],
): Promise<Map<string, SessionWorkInfo>> {
  const gymIds = sessions.map((session) => session.id);
  const info = new Map<string, SessionWorkInfo>();
  if (gymIds.length === 0) {
    return info;
  }

  const grouped = await loadWorkBySession(userId, gymIds);
  for (const [sessionId, exercises] of grouped) {
    let plan_hit = 0;
    let plan_total = 0;
    for (const item of exercises) {
      const score = firstWorkPlanScore(item.sets);
      plan_hit += score.hit;
      plan_total += score.total;
    }
    info.set(sessionId, {
      summary: formatWorkSummary(exercises),
      plan_hit,
      plan_total,
    });
  }

  return info;
}
