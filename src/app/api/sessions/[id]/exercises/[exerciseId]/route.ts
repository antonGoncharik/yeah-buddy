import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk, whenMessage } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { removeSessionExercise } from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ id: string; exerciseId: string }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id, exerciseId } = await context.params;

  try {
    const detail = await removeSessionExercise(
      auth.session.userId,
      id,
      exerciseId,
    );
    if (!detail) {
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    return failRoute(error, [
      whenMessage("Упражнение не найдено в тренировке.", 400),
      whenMessage("Нельзя убрать упражнение с выполненными подходами.", 400),
    ]);
  }
}
