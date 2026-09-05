import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
import { getSessionDetail } from "@/lib/workout/session-work";
import {
  cancelSession,
  patchSession,
  patchSessionSchema,
  SessionLockedError,
} from "@/lib/workout/sessions";

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
    const detail = await getSessionDetail(auth.session.userId, id);
    if (!detail) {
      return NextResponse.json(
        { error: "Тренировка не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json(detail);
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

  const parsed = patchSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const session = await patchSession(auth.session.userId, id, parsed.data);
    if (!session) {
      return NextResponse.json(
        { error: "Тренировка не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
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
    const deleted = await cancelSession(auth.session.userId, id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Тренировка не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SessionLockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
