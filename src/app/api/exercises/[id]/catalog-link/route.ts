import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { CHECK_FIELDS } from "@/lib/messages";
import { CatalogExerciseNotFoundError } from "@/lib/workout/exercise-catalog-errors";
import { linkExerciseCatalog } from "@/lib/workout/exercise-catalog-store";
import { exerciseCatalogLinkSchema } from "@/lib/workout/exercise-schema";
import { getExercise } from "@/lib/workout/exercises";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(CHECK_FIELDS, 400);
  }

  const parsed = exerciseCatalogLinkSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const existing = await getExercise(auth.session.userId, id);
    if (!existing) {
      return jsonError("Упражнение не найдено.", 404);
    }

    await linkExerciseCatalog(
      auth.session.userId,
      id,
      parsed.data.catalog_exercise_id,
    );

    const exercise = await getExercise(auth.session.userId, id);
    if (!exercise) {
      return jsonError("Упражнение не найдено.", 404);
    }

    return jsonOk({ exercise });
  } catch (error) {
    return failRoute(error, [whenError(CatalogExerciseNotFoundError, 404)]);
  }
}
