import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { OrderMismatchError } from "@/lib/order";
import {
  reorderSessionExercises,
  reorderSessionExercisesSchema,
} from "@/lib/workout/session-work";

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
  const parsed = await parseJsonSchema(request, reorderSessionExercisesSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const detail = await reorderSessionExercises(
      auth.session.userId,
      id,
      parsed.data.exerciseIds,
    );
    if (!detail) {
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    return failRoute(error, [whenError(OrderMismatchError, 400)]);
  }
}
