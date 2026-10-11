import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  sessionTracksSchema,
  setSessionTracks,
} from "@/lib/workout/session-tracks";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Sets working kilograms for slots that use kg but have none yet. */
export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;
    const parsed = await parseJsonSchema(request, sessionTracksSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const detail = await setSessionTracks(session.userId, id, parsed.data);
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }

      return jsonOk(detail);
    } catch (error) {
      return failRoute(error, [whenMessage("Тренировка уже закончена.", 400)]);
    }
  },
);
