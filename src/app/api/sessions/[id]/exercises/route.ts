import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
import {
  addExerciseToSession,
  addSessionExerciseSchema,
} from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
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
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = addSessionExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const detail = await addExerciseToSession(
      auth.session.userId,
      id,
      parsed.data.exercise_id,
    );
    if (!detail) {
      return NextResponse.json(
        { error: "Тренировка не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && isClientError(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

function isClientError(message: string): boolean {
  return (
    message === "Упражнение не найдено." ||
    message === "Это упражнение не подходит к типу тренировки." ||
    message === "Для упражнения нет максимума в текущей фазе."
  );
}
