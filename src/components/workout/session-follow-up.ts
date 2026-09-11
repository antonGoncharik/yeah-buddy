import { mutateJson } from "@/lib/api-cache";
import {
  phaseEndHint,
  phaseHoldHint,
  readPhaseCircle,
} from "@/lib/workout/hints";
import { readTemplate } from "@/lib/workout/hub-payload";

export async function loadSessionFollowUp(sessionDate: string): Promise<{
  nextName: string | null;
  phaseHint: string | null;
  holdHint: string | null;
}> {
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
    };
  } catch {
    return { nextName: null, phaseHint: null, holdHint: null };
  }
}
