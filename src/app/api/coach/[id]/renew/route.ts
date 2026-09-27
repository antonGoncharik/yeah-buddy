import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { CoachNotFoundError } from "@/lib/coach/errors";
import { isCoachGrantId } from "@/lib/coach/id";
import { renewCoachGrant } from "@/lib/coach/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
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
    const grant = await renewCoachGrant(auth.session.userId, id);
    return jsonOk({ grant });
  } catch (error) {
    return failRoute(error, [whenError(CoachNotFoundError, 404)]);
  }
}
