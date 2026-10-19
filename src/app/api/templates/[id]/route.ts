import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { WORKOUT_NOT_FOUND } from "@/lib/messages";
import { syncTodaysSessionTemplate } from "@/lib/workout/session-rebuild";
import {
  getTemplate,
  templateWriteSchema,
  updateTemplate,
} from "@/lib/workout/templates";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const template = await getTemplate(session.userId, id);
      if (!template) {
        return jsonError(WORKOUT_NOT_FOUND, 404);
      }

      return jsonOk({ template });
    } catch (error) {
      return failRoute(error);
    }
  },
);

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;

    const parsed = await parseJsonSchema(request, templateWriteSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const template = await updateTemplate(session.userId, id, parsed.data);
      if (!template) {
        return jsonError(WORKOUT_NOT_FOUND, 404);
      }

      await syncTodaysSessionTemplate(session.userId, id);

      return jsonOk({ template });
    } catch (error) {
      return failRoute(error);
    }
  },
);
