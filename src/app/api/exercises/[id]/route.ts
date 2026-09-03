import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
import {
  archiveExercise,
  exerciseUpdateSchema,
  getExercise,
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
      return NextResponse.json(
        { error: "Упражнение не найдено." },
        { status: 404 },
      );
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
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
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  if (isArchivePatch(body)) {
    try {
      const exercise = await archiveExercise(
        auth.session.userId,
        id,
        body.archived,
      );
      if (!exercise) {
        return NextResponse.json(
          { error: "Упражнение не найдено." },
          { status: 404 },
        );
      }

      return NextResponse.json({ exercise });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
    }
  }

  const parsed = exerciseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const exercise = await updateExercise(auth.session.userId, id, parsed.data);
    if (!exercise) {
      return NextResponse.json(
        { error: "Упражнение не найдено." },
        { status: 404 },
      );
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
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
