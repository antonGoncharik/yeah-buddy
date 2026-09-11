import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError, whenMessage } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { fillDayRemaining, PastDayLockedError } from "@/lib/days";

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

  try {
    const day = await fillDayRemaining(auth.session.userId, id);
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenMessage("Day not found", 404, "День не найден."),
    ]);
  }
}
