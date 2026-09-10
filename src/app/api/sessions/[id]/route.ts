import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
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
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk(detail);
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

  const parsed = await parseJsonSchema(request, patchSessionSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const session = await patchSession(auth.session.userId, id, parsed.data);
    if (!session) {
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk({ session });
  } catch (error) {
    return failRoute(error);
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
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error, [whenError(SessionLockedError, 409)]);
  }
}
