import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { PastDayLockedError, setDayType } from "@/lib/days";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  dayType: z.enum(["rest", "training"]),
});

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const day = await setDayType(auth.session.userId, id, parsed.data.dayType);
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenMessage("Day not found", 404, "День не найден."),
    ]);
  }
}
