import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  CatalogFoodNotFoundError,
  copyCatalogFood,
} from "@/lib/food/catalog-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const food = await copyCatalogFood(session.userId, id);
      return jsonOk({ food });
    } catch (error) {
      return failRoute(error, [whenError(CatalogFoodNotFoundError, 404)]);
    }
  },
);
