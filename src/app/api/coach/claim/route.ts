import { z } from "zod";
import { trackEvent } from "@/lib/analytics/track";
import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  CoachNotFoundError,
  CoachOwnError,
  CoachTakenError,
} from "@/lib/coach/errors";
import { readCoachToken } from "@/lib/coach/start";
import { claimCoachGrant } from "@/lib/coach/store";

const bodySchema = z.object({
  token: z.string().trim().min(1).max(80),
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(
    request,
    bodySchema,
    (data) => readCoachToken(data.token) != null,
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  const token = readCoachToken(parsed.data.token);
  if (!token) {
    return failRoute(new CoachNotFoundError(), [
      whenError(CoachNotFoundError, 404),
    ]);
  }

  try {
    const grant = await claimCoachGrant(session.userId, token);
    await trackEvent(session.userId, "coach_claim");
    return jsonOk(grant);
  } catch (error) {
    return failRoute(error, [
      whenError(CoachNotFoundError, 404),
      whenError(CoachOwnError, 409),
      whenError(CoachTakenError, 409),
    ]);
  }
});
