import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { CatalogExerciseNotFoundError } from "@/lib/workout/exercise-catalog-errors";
import { linkExerciseCatalog } from "@/lib/workout/exercise-catalog-store";
import { exerciseCatalogLinkSchema } from "@/lib/workout/exercise-schema";
import { getExercise } from "@/lib/workout/exercises";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;

    const parsed = await parseJsonSchema(request, exerciseCatalogLinkSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const existing = await getExercise(session.userId, id);
      if (!existing) {
        return jsonError("Упражнение не найдено.", 404);
      }

      await linkExerciseCatalog(
        session.userId,
        id,
        parsed.data.catalog_exercise_id,
      );

      const exercise = await getExercise(session.userId, id);
      if (!exercise) {
        return jsonError("Упражнение не найдено.", 404);
      }

      return jsonOk({ exercise });
    } catch (error) {
      return failRoute(error, [whenError(CatalogExerciseNotFoundError, 404)]);
    }
  },
);
