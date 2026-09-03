import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
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
      return NextResponse.json(
        { error: "Тренировка не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Упражнение не найдено в тренировке." ||
        error.message === "Нельзя убрать упражнение с выполненными подходами.")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
