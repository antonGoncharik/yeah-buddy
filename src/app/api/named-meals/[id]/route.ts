import { failRoute, jsonError, jsonOk, whenMessage } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { NOT_FOUND } from "@/lib/messages";
import { deleteNamedMeal } from "@/lib/named-meal/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const deleted = await deleteNamedMeal(session.userId, id);
      if (!deleted) {
        return jsonError(NOT_FOUND, 404);
      }
      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error, [whenMessage("Meal not found", 404, NOT_FOUND)]);
    }
  },
);
