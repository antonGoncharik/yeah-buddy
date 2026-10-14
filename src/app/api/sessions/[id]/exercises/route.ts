import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { OrderMismatchError } from "@/lib/order";
import {
  addSessionExercise,
  addSessionExerciseSchema,
  reorderSessionExercises,
  reorderSessionExercisesSchema,
} from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;
    const parsed = await parseJsonSchema(request, addSessionExerciseSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const detail = await addSessionExercise(
        session.userId,
        id,
        parsed.data.exerciseId,
      );
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }

      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [
        whenMessage(
          "Добавить упражнение можно только в открытой тренировке.",
          400,
        ),
        whenMessage("Упражнение не найдено.", 404),
        whenMessage("Не получилось добавить упражнение.", 400),
      ]);
    }
  },
);

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;
    const parsed = await parseJsonSchema(
      request,
      reorderSessionExercisesSchema,
    );
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const detail = await reorderSessionExercises(
        session.userId,
        id,
        parsed.data.exerciseIds,
      );
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }

      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [whenError(OrderMismatchError, 400)]);
    }
  },
);
