import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { getSessionDetail } from "@/lib/workout/session-work";
import {
  cancelSession,
  patchSession,
  patchSessionSchema,
  SessionLockedError,
} from "@/lib/workout/sessions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const detail = await getSessionDetail(session.userId, id);
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }

      return jsonOk(detail);
    } catch (error) {
      return failRoute(error);
    }
  },
);

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;

    const parsed = await parseJsonSchema(request, patchSessionSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const userId = session.userId;
    try {
      const session = await patchSession(userId, id, parsed.data);
      if (!session) {
        return jsonError("Тренировка не найдена.", 404);
      }

      return jsonOk({ session });
    } catch (error) {
      return failRoute(error);
    }
  },
);

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const deleted = await cancelSession(session.userId, id);
      if (!deleted) {
        return jsonError("Тренировка не найдена.", 404);
      }

      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error, [whenError(SessionLockedError, 409)]);
    }
  },
);
