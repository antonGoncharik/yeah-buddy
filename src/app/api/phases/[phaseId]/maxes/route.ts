import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { phaseMaxInputSchema, setPhaseMax } from "@/lib/workout/macros";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ phaseId: string }>;
};

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { phaseId } = await context.params;

    const parsed = await parseJsonSchema(request, phaseMaxInputSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const phaseMax = await setPhaseMax(session.userId, phaseId, parsed.data);
      await rebuildTodaysPlannedSession(session.userId);
      return jsonOk({ phase_max: phaseMax });
    } catch (error) {
      return failRoute(error, [whenMessage("Этап не найден.", 404)]);
    }
  },
);
