import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { StartingMaxLockedError } from "@/lib/workout/exercise-schema";
import { applySessionMaxRaises } from "@/lib/workout/session-raise-store";

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
    const detail = await applySessionMaxRaises(auth.session.userId, id);
    if (!detail) {
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    return failRoute(error, [
      whenError(StartingMaxLockedError, 409),
      whenMessage("Сначала закончи тренировку.", 400),
    ]);
  }
}
