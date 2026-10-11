import { failRoute, jsonOk, whenError, whenMessage } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { fillMealRemaining, PastDayLockedError } from "@/lib/days";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { mealId } = await context.params;

    try {
      const day = await fillMealRemaining(session.userId, mealId);
      return jsonOk({ day });
    } catch (error) {
      return failRoute(error, [
        whenError(PastDayLockedError, 409),
        whenMessage("Meal not found", 404, "Приём пищи не найден."),
      ]);
    }
  },
);
