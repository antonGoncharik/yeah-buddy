import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { applyEaseWeek, EaseWeekError } from "@/lib/workout/ease-week-store";
import { StartingMaxLockedError } from "@/lib/workout/exercise-schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const kind = await applyEaseWeek(session.userId, id);
      return jsonOk({ ease_week: kind });
    } catch (error) {
      return failRoute(error, [
        whenError(EaseWeekError, 409),
        whenError(StartingMaxLockedError, 409),
      ]);
    }
  },
);
