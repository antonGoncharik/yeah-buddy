import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { getCatalogExercise } from "@/lib/workout/exercise-catalog-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = sessionRoute(
  async (_session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const exercise = await getCatalogExercise(id);
      if (!exercise) {
        return jsonError("Упражнение не найдено в каталоге.", 404);
      }

      return jsonOk({ exercise });
    } catch (error) {
      return failRoute(error);
    }
  },
);
