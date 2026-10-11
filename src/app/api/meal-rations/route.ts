import { z } from "zod";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { applyRation } from "@/lib/food/apply-ration";
import { RATION_IDS, RationFoodMissingError } from "@/lib/food/ration";

const rationApplySchema = z.object({
  id: z.enum(RATION_IDS),
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, rationApplySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const templates = await applyRation(session.userId, parsed.data.id);
    return jsonOk({ templates });
  } catch (error) {
    return failRoute(error, [whenError(RationFoodMissingError, 400)]);
  }
});
