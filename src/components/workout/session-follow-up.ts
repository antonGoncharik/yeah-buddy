import { mutateJson } from "@/lib/api-cache";
import { isIsoDate } from "@/lib/day/dates";
import { isRecord } from "@/lib/read";
import type { PhaseCircleProgress } from "@/lib/types";
import {
  phaseEndHint,
  phaseHoldHint,
  readPhaseCircle,
} from "@/lib/workout/hints";
import { readTemplate } from "@/lib/workout/hub-payload";
import { toNumber } from "@/lib/workout/numbers";

export async function loadSessionFollowUp(sessionDate: string): Promise<{
  nextName: string | null;
  phaseHint: string | null;
  holdHint: string | null;
  completedSessions: number;
  lastCompletedBefore: string | null;
  phaseCircle: PhaseCircleProgress | null;
}> {
  const empty = {
    nextName: null,
    phaseHint: null,
    holdHint: null,
    completedSessions: 0,
    lastCompletedBefore: null,
    phaseCircle: null,
  };

  try {
    const data = await mutateJson(
      `/api/sessions?date=${encodeURIComponent(sessionDate)}`,
    );
    const nextTemplate = readTemplate(data, "next_template");
    const circle = readPhaseCircle(data);
    return {
      nextName: nextTemplate?.name ?? null,
      phaseHint: circle ? phaseEndHint(circle) : null,
      holdHint: circle ? phaseHoldHint(circle) : null,
      completedSessions: isRecord(data) ? toNumber(data.completed_sessions) : 0,
      lastCompletedBefore:
        isRecord(data) &&
        typeof data.last_completed_before === "string" &&
        isIsoDate(data.last_completed_before)
          ? data.last_completed_before
          : null,
      phaseCircle: circle,
    };
  } catch {
    return empty;
  }
}
