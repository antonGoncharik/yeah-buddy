import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  sessionTracksSchema,
  setSessionTracks,
} from "@/lib/workout/session-tracks";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Starts weight lines for «по линейке» slots that have none and plans them. */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  const parsed = await parseJsonSchema(request, sessionTracksSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const detail = await setSessionTracks(auth.session.userId, id, parsed.data);
    if (!detail) {
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    return failRoute(error, [whenMessage("Тренировка уже закончена.", 400)]);
  }
}
