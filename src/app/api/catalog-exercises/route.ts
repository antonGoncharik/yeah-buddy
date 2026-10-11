import { failRoute, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { searchCatalogExercises } from "@/lib/workout/exercise-catalog-store";

export const GET = sessionRoute(async (_session, request) => {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const exercises = await searchCatalogExercises(query);
    return jsonOk({ exercises });
  } catch (error) {
    return failRoute(error);
  }
});
