import { failRoute, jsonError, jsonOk, whenMessage } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { shortenSession } from "@/lib/workout/session-short-apply";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;
    try {
      const detail = await shortenSession(session.userId, id);
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }
      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [
        whenMessage("Ужать можно только открытую тренировку.", 400),
      ]);
    }
  },
);
