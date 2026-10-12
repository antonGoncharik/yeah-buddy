import { z } from "zod";
import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import {
  createReview,
  getReviewSnapshot,
  parseReviewRange,
} from "@/lib/ai/review";
import { trackAiRequest } from "@/lib/analytics/ai";
import { rateLimitUser } from "@/lib/api/rate-limit";
import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { CHECK_FIELDS } from "@/lib/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const bodySchema = z.object({
  days: z.union([z.literal(14), z.literal(30), z.literal(90)]),
});

export const GET = sessionRoute(async (session, request) => {
  const days = parseReviewRange(
    new URL(request.url).searchParams.get("days") ?? "14",
  );
  if (!days) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const snapshot = await getReviewSnapshot(session.userId, days);
    return jsonOk(snapshot);
  } catch (error) {
    return failRoute(error);
  }
});

export const POST = sessionRoute(async (session, request) => {
  const limited = rateLimitUser(session.userId, "ai", 5, 60_000);
  if (limited) {
    return limited;
  }

  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const snapshot = await createReview(session.userId, parsed.data.days);
    await trackAiRequest(session.userId, "review", true);
    return jsonOk(snapshot);
  } catch (error) {
    await trackAiRequest(session.userId, "review", false);
    return failRoute(error, [
      (err) =>
        err instanceof ReviewError
          ? jsonError(
              err.message,
              reviewStatus(err.code),
              err.code === "QUOTA" ? { remaining: 0 } : undefined,
            )
          : null,
    ]);
  }
});
