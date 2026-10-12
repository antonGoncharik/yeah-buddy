import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import type { MuscleId } from "@/lib/types";
import {
  createExercise,
  exerciseCreateSchema,
  listExercises,
  listExercisesForMuscle,
} from "@/lib/workout/exercises";
import { MUSCLE_IDS } from "@/lib/workout/muscle-taxonomy";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

function parseMuscleFilter(value: string | null): MuscleId | null {
  if (!value || value.trim() === "") {
    return null;
  }
  const id = value.trim() as MuscleId;
  return MUSCLE_IDS.includes(id) ? id : null;
}

export const GET = sessionRoute(async (session, request) => {
  const params = new URL(request.url).searchParams;
  const filterParam = params.get("filter");
  const filter =
    filterParam === "archived" || filterParam === "all"
      ? filterParam
      : "active";
  const muscleId = parseMuscleFilter(params.get("muscle"));

  try {
    await ensureWorkoutSettings(session.userId);
    const exercises = muscleId
      ? await listExercisesForMuscle(session.userId, muscleId, filter)
      : await listExercises(session.userId, filter);
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
