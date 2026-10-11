import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { setFoodFavorite } from "@/lib/food/store";
import { foodFavoriteSchema } from "@/lib/foods";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;

    const parsed = await parseJsonSchema(request, foodFavoriteSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const food = await setFoodFavorite(
        session.userId,
        id,
        parsed.data.is_favorite,
      );
      if (!food) {
        return jsonError("Продукт не найден.", 404);
      }

      return jsonOk({ food });
    } catch (error) {
      return failRoute(error);
    }
  },
);
