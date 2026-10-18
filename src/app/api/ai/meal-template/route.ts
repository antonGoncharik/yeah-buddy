import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import { reviewMealTemplatesWithModel } from "@/lib/ai/meal-template-review";
import { trackAiRequest } from "@/lib/analytics/ai";
import { rateLimitUser } from "@/lib/api/rate-limit";
import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = sessionRoute(async (session) => {
  const limited = rateLimitUser(session.userId, "meal-template", 8, 60_000);
  if (limited) {
    return limited;
  }

  try {
    const result = await reviewMealTemplatesWithModel(session.userId);
    await trackAiRequest(session.userId, "assistant", true);
    return jsonOk(result);
  } catch (error) {
    await trackAiRequest(session.userId, "assistant", false);
    return failRoute(error, [
      (err) =>
        err instanceof ReviewError
          ? jsonError(err.message, reviewStatus(err.code), {
              remaining: err.code === "QUOTA" ? 0 : undefined,
            })
          : null,
    ]);
  }
});
