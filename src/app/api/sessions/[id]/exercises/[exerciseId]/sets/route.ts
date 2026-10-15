import { failRoute, jsonError, jsonOk, whenMessage } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { appendSessionWorkSet } from "@/lib/workout/session-set-add-apply";

type RouteContext = {
  params: Promise<{ id: string; exerciseId: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id, exerciseId } = await context.params;
    try {
      const detail = await appendSessionWorkSet(session.userId, id, exerciseId);
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }
      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [
        whenMessage("Подход можно добавить только в открытой тренировке.", 400),
        whenMessage("Упражнение не найдено в тренировке.", 404),
        whenMessage("Нет рабочего подхода, который можно повторить.", 400),
      ]);
    }
  },
);
