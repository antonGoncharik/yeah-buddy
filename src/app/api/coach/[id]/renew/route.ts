import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { CoachNotFoundError } from "@/lib/coach/errors";
import { isCoachGrantId } from "@/lib/coach/id";
import { renewCoachGrant } from "@/lib/coach/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;
    if (!isCoachGrantId(id)) {
      return failRoute(new CoachNotFoundError(), [
        whenError(CoachNotFoundError, 404),
      ]);
    }

    try {
      const grant = await renewCoachGrant(session.userId, id);
      return jsonOk({ grant });
    } catch (error) {
      return failRoute(error, [whenError(CoachNotFoundError, 404)]);
    }
  },
);
