import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { isIsoDate } from "@/lib/day/dates";
import { CHECK_DATE } from "@/lib/messages";
import { resolveEaseWeek } from "@/lib/workout/ease-week-store";
import {
  createSession,
  createSessionSchema,
  getTodayWorkoutState,
  SessionConflictError,
  TemplateEmptyError,
} from "@/lib/workout/sessions";
import { TemplateNotFoundError } from "@/lib/workout/templates";

export const GET = sessionRoute(async (session, request) => {
  const date = new URL(request.url).searchParams.get("date");
  if (!date || !isIsoDate(date)) {
    return jsonError(CHECK_DATE, 400);
  }

  try {
    const [today, ease] = await Promise.all([
      getTodayWorkoutState(session.userId, date),
      resolveEaseWeek(session.userId),
    ]);
    return jsonOk({
      ...today,
      ease_week: ease.kind,
      ease_session_id: ease.sessionId,
    });
  } catch (error) {
    return failRoute(error);
  }
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, createSessionSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  const userId = session.userId;
  try {
    const session = await createSession(userId, parsed.data);
    return jsonOk({ session });
  } catch (error) {
    return failRoute(error, [
      whenError(TemplateEmptyError, 400),
      whenError(SessionConflictError, 409),
      whenError(TemplateNotFoundError, 409),
    ]);
  }
});
