import { z } from "zod";

import { runAssistant } from "@/lib/ai/assistant/run";
import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import { trackAiRequest } from "@/lib/analytics/ai";
import { rateLimitUser } from "@/lib/api/rate-limit";
import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const bodySchema = z.object({
  message: z.string().trim().min(2).max(500),
});

export const POST = sessionRoute(async (session, request) => {
  const limited = rateLimitUser(session.userId, "ai", 8, 60_000);
  if (limited) {
    return limited;
  }

  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const result = await runAssistant(session.userId, parsed.data.message);
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
