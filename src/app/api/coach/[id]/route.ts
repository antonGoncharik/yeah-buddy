import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { loadCoachBoard } from "@/lib/coach/board";
import { CoachNotFoundError } from "@/lib/coach/errors";
import { isCoachGrantId } from "@/lib/coach/id";
import { revokeCoachGrant } from "@/lib/coach/store";

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
  if (!isCoachGrantId(id)) {
    return failRoute(new CoachNotFoundError(), [
      whenError(CoachNotFoundError, 404),
    ]);
  }

  try {
    const board = await loadCoachBoard(auth.session.userId, id);
    return jsonOk({ board });
  } catch (error) {
    return failRoute(error, [whenError(CoachNotFoundError, 404)]);
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
  if (!isCoachGrantId(id)) {
    return failRoute(new CoachNotFoundError(), [
      whenError(CoachNotFoundError, 404),
    ]);
  }

  try {
    await revokeCoachGrant(auth.session.userId, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error, [whenError(CoachNotFoundError, 404)]);
  }
}
