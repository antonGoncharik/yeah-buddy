import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  confirmTransition,
  confirmTransitionSchema,
  previewTransition,
} from "@/lib/workout/macros";
import { rebuildTodaysPlannedSession } from "@/lib/workout/session-work";

export const GET = sessionRoute(
  async (session) => {
    const preview = await previewTransition(session.userId);
    return jsonOk({ preview });
  },
  [whenMessage("Нет текущего этапа.", 409)],
);

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, confirmTransitionSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const state = await confirmTransition(session.userId, parsed.data);
    await rebuildTodaysPlannedSession(session.userId);
    return jsonOk(state);
  } catch (error) {
    return failRoute(error, [
      whenMessage("Нет текущего этапа.", 409),
      whenMessage("Нет текущего цикла.", 409),
      whenMessage("Новый цикл начинается после последнего этапа.", 409),
      whenMessage("Сначала упражнения.", 409),
    ]);
  }
});
