import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { WORKOUT_NOT_FOUND } from "@/lib/messages";
import { skipTemplateInRotation } from "@/lib/workout/settings";
import { getTemplate } from "@/lib/workout/templates";

const skipSchema = z.object({
  template_id: z.string().uuid(),
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, skipSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const template = await getTemplate(session.userId, parsed.data.template_id);
    if (!template) {
      return jsonError(WORKOUT_NOT_FOUND, 404);
    }

    await skipTemplateInRotation(session.userId, template.id);
    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error);
  }
});
