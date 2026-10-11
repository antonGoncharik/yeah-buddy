import { failRoute, jsonOk, whenError, whenMessage } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { clearDayFood, PastDayLockedError } from "@/lib/days";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const day = await clearDayFood(session.userId, id);
      return jsonOk({ day });
    } catch (error) {
      return failRoute(error, [
        whenError(PastDayLockedError, 409),
        whenMessage("Day not found", 404, "День не найден."),
      ]);
    }
  },
);
