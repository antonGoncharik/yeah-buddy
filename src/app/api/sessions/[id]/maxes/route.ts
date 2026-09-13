import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { StartingMaxLockedError } from "@/lib/workout/exercise-schema";
import {
  sessionMaxesSchema,
  setSessionMaxes,
} from "@/lib/workout/session-maxes";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  const parsed = await parseJsonSchema(request, sessionMaxesSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const detail = await setSessionMaxes(auth.session.userId, id, parsed.data);
    if (!detail) {
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    return failRoute(error, [
      whenError(StartingMaxLockedError, 409),
      whenMessage("Тренировка уже закончена.", 400),
    ]);
  }
}
