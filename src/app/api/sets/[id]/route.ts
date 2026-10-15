import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { SessionLockedError } from "@/lib/workout/session-errors";
import { deleteExtraWorkSet } from "@/lib/workout/session-set-add-apply";
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
      return failRoute(error, [
        whenError(SessionLockedError, 409),
        whenMessage("Напиши фактический вес.", 400),
      ]);
    }
  },
);

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;
    try {
      const detail = await deleteExtraWorkSet(session.userId, id);
      if (!detail) {
        return jsonError("Подход не найден.", 404);
      }
      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [
        whenMessage("Убрать подход можно только в открытой тренировке.", 400),
        whenMessage("Этот подход уже отмечен.", 400),
        whenMessage("Последний рабочий подход не убирается.", 400),
      ]);
    }
  },
);
