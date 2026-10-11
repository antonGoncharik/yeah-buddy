import { failRoute, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { searchCatalogFoods } from "@/lib/food/catalog-store";

export const GET = sessionRoute(async (session, request) => {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const foods = await searchCatalogFoods(session.userId, query);
    return jsonOk({ foods });
  } catch (error) {
    return failRoute(error);
  }
});
