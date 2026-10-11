import { commitPlateItems, plateCommitSchema } from "@/lib/ai/plate-commit";
import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { PastDayLockedError } from "@/lib/days";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { mealId } = await context.params;
    const parsed = await parseJsonSchema(request, plateCommitSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const items = await commitPlateItems(session.userId, mealId, parsed.data);
      return jsonOk({ items });
    } catch (error) {
      return failRoute(error, [
        whenError(PastDayLockedError, 409),
        whenMessage("Meal not found", 404, "Приём пищи не найден."),
        whenMessage("Food not found", 404, "Продукт не найден."),
      ]);
    }
  },
);
