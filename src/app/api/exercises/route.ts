import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  createExercise,
  exerciseCreateSchema,
  listExercises,
} from "@/lib/workout/exercises";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export const GET = sessionRoute(async (session, request) => {
  const filterParam = new URL(request.url).searchParams.get("filter");
  const filter =
    filterParam === "archived" || filterParam === "all"
      ? filterParam
      : "active";

  try {
    await ensureWorkoutSettings(session.userId);
    const exercises = await listExercises(session.userId, filter);
    return jsonOk({ exercises });
  } catch (error) {
    return failRoute(error);
  }
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, exerciseCreateSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    await ensureWorkoutSettings(session.userId);
    const exercise = await createExercise(session.userId, parsed.data);
    return jsonOk({ exercise });
  } catch (error) {
    return failRoute(error);
  }
});
