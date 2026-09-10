import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { CHECK_FIELDS } from "@/lib/messages";
import {
  archiveExercise,
  exerciseUpdateSchema,
  getExercise,
  StartingMaxLockedError,
  updateExercise,
} from "@/lib/workout/exercises";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
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

    return jsonOk({ exercise });
  } catch (error) {
    return failRoute(error);
  }
}

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

  if (isArchivePatch(body)) {
    try {
      const exercise = await archiveExercise(
        auth.session.userId,
        id,
        body.archived,
      );
      if (!exercise) {
        return jsonError("Упражнение не найдено.", 404);
      }

      return jsonOk({ exercise });
    } catch (error) {
      return failRoute(error);
    }
  }

  const parsed = exerciseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const exercise = await updateExercise(auth.session.userId, id, parsed.data);
    if (!exercise) {
      return jsonError("Упражнение не найдено.", 404);
    }

    return jsonOk({ exercise });
  } catch (error) {
    return failRoute(error, [whenError(StartingMaxLockedError, 409)]);
  }
}

function isArchivePatch(body: unknown): body is { archived: boolean } {
  return (
    !!body &&
    typeof body === "object" &&
    "archived" in body &&
    typeof body.archived === "boolean" &&
    Object.keys(body).length === 1
  );
}
