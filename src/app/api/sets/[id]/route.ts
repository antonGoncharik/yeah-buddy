import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { patchSetSchema, patchWorkoutSet } from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const parsed = await parseJsonSchema(request, patchSetSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const detail = await patchWorkoutSet(auth.session.userId, id, parsed.data);
    if (!detail) {
      return jsonError("Подход не найден.", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    return failRoute(error, [whenMessage("Напиши фактический вес.", 400)]);
  }
}
