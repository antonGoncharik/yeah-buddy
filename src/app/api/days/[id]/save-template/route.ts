import { failRoute, jsonOk, whenError, whenMessage } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  DayTemplateEmptyError,
  saveDayAsMealTemplate,
} from "@/lib/day/save-template";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const result = await saveDayAsMealTemplate(session.userId, id);
      return jsonOk(result);
    } catch (error) {
      return failRoute(error, [
        whenError(DayTemplateEmptyError, 400),
        whenMessage("Day not found", 404, "День не найден."),
      ]);
    }
  },
);
