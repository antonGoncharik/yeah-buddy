import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
import { patchSetSchema, patchWorkoutSet } from "@/lib/workout/session-work";

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
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = patchSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const detail = await patchWorkoutSet(auth.session.userId, id, parsed.data);
    if (!detail) {
      return NextResponse.json({ error: "Подход не найден." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Укажите фактический вес."
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
