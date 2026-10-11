import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { patchSetSchema, patchWorkoutSet } from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;

    const parsed = await parseJsonSchema(request, patchSetSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const detail = await patchWorkoutSet(session.userId, id, parsed.data);
      if (!detail) {
        return jsonError("Подход не найден.", 404);
      }

      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [whenMessage("Напиши фактический вес.", 400)]);
    }
  },
);
