import { z } from "zod";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  fitMealTemplates,
  TemplateFitUnavailableError,
} from "@/lib/food/apply-template-fit";

const fitSchema = z.object({
  dayType: z.enum(["rest", "training"]).optional(),
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, fitSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const result = await fitMealTemplates(
      session.userId,
      parsed.data.dayType ?? null,
    );
    return jsonOk(result);
  } catch (error) {
    return failRoute(error, [whenError(TemplateFitUnavailableError, 400)]);
  }
});
