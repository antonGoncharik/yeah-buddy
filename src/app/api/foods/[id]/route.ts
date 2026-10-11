import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { deleteFood, getFood, updateFood } from "@/lib/food/store";
import { foodInputSchema } from "@/lib/foods";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const FOOD_NOT_FOUND = "Продукт не найден.";

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const food = await getFood(session.userId, id);
      if (!food) {
        return jsonError(FOOD_NOT_FOUND, 404);
      }

      return jsonOk({ food });
    } catch (error) {
      return failRoute(error);
    }
  },
);

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;

    const parsed = await parseJsonSchema(request, foodInputSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const food = await updateFood(session.userId, id, parsed.data);
      if (!food) {
        return jsonError(FOOD_NOT_FOUND, 404);
      }

      return jsonOk({ food });
    } catch (error) {
      return failRoute(error);
    }
  },
);

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const deleted = await deleteFood(session.userId, id);
      if (!deleted) {
        return jsonError(FOOD_NOT_FOUND, 404);
      }

      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error);
    }
  },
);
