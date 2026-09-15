import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
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

/** Sets (or replaces) the exercise's weight line. */
export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  const parsed = await parseJsonSchema(request, trackWriteSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const exercise = await getExercise(auth.session.userId, id);
    if (!exercise) {
      return jsonError("Упражнение не найдено.", 404);
    }

    await saveExerciseTrack(auth.session.userId, id, parsed.data);
    await rebuildTodaysPlannedSession(auth.session.userId);
    const refreshed = await getExercise(auth.session.userId, id);
    return jsonOk({ exercise: refreshed ?? exercise });
  } catch (error) {
    return failRoute(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const exercise = await getExercise(auth.session.userId, id);
    if (!exercise) {
      return jsonError("Упражнение не найдено.", 404);
    }

    await deleteExerciseTrack(auth.session.userId, id);
    await rebuildTodaysPlannedSession(auth.session.userId);
    const refreshed = await getExercise(auth.session.userId, id);
    return jsonOk({ exercise: refreshed ?? exercise });
  } catch (error) {
    return failRoute(error);
  }
}
