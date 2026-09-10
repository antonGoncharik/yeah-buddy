import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { phaseMaxInputSchema, setPhaseMax } from "@/lib/workout/macros";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ phaseId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { phaseId } = await context.params;

  const parsed = await parseJsonSchema(request, phaseMaxInputSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const phaseMax = await setPhaseMax(
      auth.session.userId,
      phaseId,
      parsed.data,
    );
    await rebuildTodaysPlannedSession(auth.session.userId);
    return jsonOk({ phase_max: phaseMax });
  } catch (error) {
    return failRoute(error, [whenMessage("Этап не найден.", 404)]);
  }
}
