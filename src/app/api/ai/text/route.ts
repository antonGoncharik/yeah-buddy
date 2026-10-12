import { z } from "zod";

import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import { rankPlateCatalog, toPlateFoodRef } from "@/lib/ai/plate-catalog";
import { analyzeTextMeal, normalizeMealLogText } from "@/lib/ai/text-meal";
import { trackAiRequest } from "@/lib/analytics/ai";
import { rateLimitUser } from "@/lib/api/rate-limit";
import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { listFoods } from "@/lib/food/store";
import { AI_TEXT_MEAL_EMPTY } from "@/lib/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  text: z.string(),
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

  if (!normalizeMealLogText(parsed.data.text)) {
    return jsonError(AI_TEXT_MEAL_EMPTY, 400);
  }

  try {
    const [all, recent] = await Promise.all([
      listFoods(session.userId, "all"),
      listFoods(session.userId, "recent"),
    ]);
    const allRefs = all.map(toPlateFoodRef);
    const catalog = rankPlateCatalog(all, recent).map(toPlateFoodRef);
    const draft = await analyzeTextMeal(
      session.userId,
      catalog,
      parsed.data.text,
      allRefs,
    );
    await trackAiRequest(session.userId, "text", true);
    return jsonOk(draft);
  } catch (error) {
    await trackAiRequest(session.userId, "text", false);
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
