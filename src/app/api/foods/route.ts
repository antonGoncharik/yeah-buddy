import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { getUserCalendarToday } from "@/lib/day/writable";
import { rankFavoriteOffers } from "@/lib/food/favorite-offer";
import {
  createFood,
  foodsAreStarterOnly,
  listFavoriteOfferHits,
  listFoods,
} from "@/lib/food/store";
import { foodInputSchema, parseFoodListFilter } from "@/lib/foods";

export const GET = sessionRoute(async (session, request) => {
  const filter = parseFoodListFilter(
    new URL(request.url).searchParams.get("filter"),
  );

  try {
    const today = await getUserCalendarToday(session.userId);
    const [foods, hits, starterOnly] = await Promise.all([
      listFoods(session.userId, filter),
      listFavoriteOfferHits(session.userId, today),
      foodsAreStarterOnly(session.userId),
    ]);
    return jsonOk({
      foods,
      favoriteOffers: rankFavoriteOffers(hits, today),
      starterOnly,
    });
  } catch (error) {
    return failRoute(error);
  }
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, foodInputSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const food = await createFood(session.userId, parsed.data);
    return jsonOk({ food });
  } catch (error) {
    return failRoute(error);
  }
});
