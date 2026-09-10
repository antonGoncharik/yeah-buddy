import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
import {
  confirmTransition,
  confirmTransitionSchema,
  previewTransition,
} from "@/lib/workout/macros";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const preview = await previewTransition(auth.session.userId);
    return NextResponse.json({ preview });
  } catch (error) {
    if (error instanceof Error && error.message === "Нет текущего этапа.") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  const parsed = confirmTransitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  try {
    const state = await confirmTransition(auth.session.userId, parsed.data);
    return NextResponse.json(state);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Нет текущего этапа." ||
        error.message === "Нет текущего цикла." ||
        error.message === "Новый цикл начинается после последнего этапа." ||
        error.message === "Сначала упражнения.")
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
