import { z } from "zod";
import { trackEvent } from "@/lib/analytics/track";
import { rateLimitUser } from "@/lib/api/rate-limit";
import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  BuddyNotFoundError,
  BuddyOwnError,
  BuddyTakenError,
} from "@/lib/buddy/errors";
import { readBuddyToken } from "@/lib/buddy/start";
import { claimBuddyGrant } from "@/lib/buddy/store";

const bodySchema = z.object({
  token: z.string().trim().min(1).max(80),
});

export const POST = sessionRoute(async (session, request) => {
  const limited = rateLimitUser(session.userId, "claim", 10, 60_000);
  if (limited) {
    return limited;
  }

  const parsed = await parseJsonSchema(
    request,
    bodySchema,
    (data) => readBuddyToken(data.token) != null,
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  const token = readBuddyToken(parsed.data.token);
  if (!token) {
    return failRoute(new BuddyNotFoundError(), [
      whenError(BuddyNotFoundError, 404),
    ]);
  }

  try {
    const grant = await claimBuddyGrant(session.userId, token);
    await trackEvent(session.userId, "buddy_claim");
    return jsonOk(grant);
  } catch (error) {
    return failRoute(error, [
      whenError(BuddyNotFoundError, 404),
      whenError(BuddyOwnError, 409),
      whenError(BuddyTakenError, 409),
    ]);
  }
});
