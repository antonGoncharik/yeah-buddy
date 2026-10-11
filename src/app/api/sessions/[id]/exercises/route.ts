import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { OrderMismatchError } from "@/lib/order";
import {
  reorderSessionExercises,
  reorderSessionExercisesSchema,
} from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
