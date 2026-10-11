import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  deleteExerciseTrack,
  saveExerciseTrack,
} from "@/lib/workout/exercise-tracks";
import { getExercise } from "@/lib/workout/exercises";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-work";
import { trackWriteSchema } from "@/lib/workout/slot-plan-schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Sets (or replaces) the exercise's working kilograms. */
export const PUT = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;
    const parsed = await parseJsonSchema(request, trackWriteSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const exercise = await getExercise(session.userId, id);
      if (!exercise) {
        return jsonError("Упражнение не найдено.", 404);
      }

      await saveExerciseTrack(session.userId, id, parsed.data);
      await rebuildTodaysPlannedSession(session.userId);
      const refreshed = await getExercise(session.userId, id);
      return jsonOk({ exercise: refreshed ?? exercise });
    } catch (error) {
      return failRoute(error);
    }
  },
);

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const exercise = await getExercise(session.userId, id);
      if (!exercise) {
        return jsonError("Упражнение не найдено.", 404);
      }

      await deleteExerciseTrack(session.userId, id);
      await rebuildTodaysPlannedSession(session.userId);
      const refreshed = await getExercise(session.userId, id);
      return jsonOk({ exercise: refreshed ?? exercise });
    } catch (error) {
      return failRoute(error);
    }
  },
);
