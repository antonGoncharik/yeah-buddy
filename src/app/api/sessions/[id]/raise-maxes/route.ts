import {
  failRoute,
  jsonError,
  jsonOk,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { StartingMaxLockedError } from "@/lib/workout/exercise-schema";
import { applySessionMaxRaises } from "@/lib/workout/session-raise-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const detail = await applySessionMaxRaises(session.userId, id);
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }

      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [
        whenError(StartingMaxLockedError, 409),
        whenMessage("Сначала закончи тренировку.", 400),
      ]);
    }
  },
);
