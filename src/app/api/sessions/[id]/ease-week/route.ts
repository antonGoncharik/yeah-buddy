import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { applyEaseWeek, EaseWeekError } from "@/lib/workout/ease-week-store";
import { StartingMaxLockedError } from "@/lib/workout/exercise-schema";

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
    const kind = await applyEaseWeek(auth.session.userId, id);
    return jsonOk({ ease_week: kind });
  } catch (error) {
    return failRoute(error, [
      whenError(EaseWeekError, 409),
      whenError(StartingMaxLockedError, 409),
    ]);
  }
}
