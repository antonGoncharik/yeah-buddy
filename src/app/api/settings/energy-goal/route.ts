import { z } from "zod";
import { trackEvent } from "@/lib/analytics/track";
import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  applyEnergyGoal,
  dismissEnergyGoal,
} from "@/lib/nutrition/energy-goal-save";

const bodySchema = z.object({
  action: z.enum(["apply", "dismiss"]),
  dismissedKcal: z.number().int().min(0).max(20_000).optional(),
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const result =
      parsed.data.action === "apply"
        ? await applyEnergyGoal(session.userId)
        : await dismissEnergyGoal(session.userId, parsed.data.dismissedKcal);
    if (!result) {
      return jsonError("Настройки не нашлись.", 404);
    }
    await trackEvent(
      session.userId,
      parsed.data.action === "apply"
        ? "energy_offer_applied"
        : "energy_offer_dismissed",
    );
    return jsonOk(result);
  } catch (error) {
    return failRoute(error);
  }
});
