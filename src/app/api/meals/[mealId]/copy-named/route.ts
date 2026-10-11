import { mealCopyFailures } from "@/lib/api/meal-copy-errors";
import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { namedMealApplySchema } from "@/lib/named-meal/schema";
import { applyNamedMeal, NamedMealNotFoundError } from "@/lib/named-meal/store";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { mealId } = await context.params;
    const parsed = await parseJsonSchema(request, namedMealApplySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const day = await applyNamedMeal(
        session.userId,
        mealId,
        parsed.data.namedMealId,
        parsed.data.replace ?? false,
      );
      return jsonOk({ day });
    } catch (error) {
      return failRoute(
        error,
        mealCopyFailures([whenError(NamedMealNotFoundError, 404)]),
      );
    }
  },
);
