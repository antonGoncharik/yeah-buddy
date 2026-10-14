import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { addSessionExerciseSchema } from "@/lib/workout/session-schema";
import {
  listSessionSwaps,
  swapSessionExercise,
} from "@/lib/workout/session-swap-apply";

type RouteContext = {
  params: Promise<{ id: string; exerciseId: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id, exerciseId } = await context.params;
    try {
      const swaps = await listSessionSwaps(session.userId, id, exerciseId);
      if (!swaps) {
        return jsonError("Тренировка не найдена.", 404);
      }
      return jsonOk(swaps);
    } catch (error) {
      return failRoute(error, [
        whenMessage("Упражнение не найдено в тренировке.", 400),
      ]);
    }
  },
);

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id, exerciseId } = await context.params;
    const parsed = await parseJsonSchema(request, addSessionExerciseSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const detail = await swapSessionExercise(
        session.userId,
        id,
        exerciseId,
        parsed.data.exerciseId,
      );
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }
      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [
        whenMessage("Упражнение не найдено в тренировке.", 400),
        whenMessage(
          "Заменить упражнение можно только в открытой тренировке.",
          400,
        ),
        whenMessage("Нельзя заменить упражнение с отмеченными подходами.", 400),
        whenMessage("Это упражнение на другую мышцу.", 400),
        whenMessage("Не получилось заменить упражнение.", 400),
      ]);
    }
  },
);
