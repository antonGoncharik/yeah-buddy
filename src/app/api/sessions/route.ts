import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
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

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const date = new URL(request.url).searchParams.get("date");
  if (!date || !isIsoDate(date)) {
    return jsonError(CHECK_DATE, 400);
  }

  try {
    const [today, ease] = await Promise.all([
      getTodayWorkoutState(auth.session.userId, date),
      resolveEaseWeek(auth.session.userId),
    ]);
    return jsonOk({
      ...today,
      ease_week: ease.kind,
      ease_session_id: ease.sessionId,
    });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, createSessionSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const session = await createSession(auth.session.userId, parsed.data);
    return jsonOk({ session });
  } catch (error) {
    return failRoute(error, [
      whenError(TemplateEmptyError, 400),
      whenError(SessionConflictError, 409),
      whenError(TemplateNotFoundError, 409),
    ]);
  }
}
