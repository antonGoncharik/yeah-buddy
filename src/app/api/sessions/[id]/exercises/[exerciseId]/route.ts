import { failRoute, jsonError, jsonOk, whenMessage } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { removeSessionExercise } from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ id: string; exerciseId: string }>;
};

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id, exerciseId } = await context.params;

    try {
      const detail = await removeSessionExercise(
        session.userId,
        id,
        exerciseId,
      );
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }

      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [
        whenMessage("Упражнение не найдено в тренировке.", 400),
        whenMessage("Нельзя убрать упражнение с выполненными подходами.", 400),
      ]);
    }
  },
);
