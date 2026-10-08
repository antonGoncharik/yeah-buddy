import type { NextResponse } from "next/server";
import { z } from "zod";

import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import { rankPlateCatalog, toPlateFoodRef } from "@/lib/ai/plate-catalog";
import { analyzeTextMeal, normalizeMealLogText } from "@/lib/ai/text-meal";
import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { listFoods } from "@/lib/food/store";
import { AI_TEXT_MEAL_EMPTY } from "@/lib/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  text: z.string(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
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
      listFoods(auth.session.userId, "all"),
      listFoods(auth.session.userId, "recent"),
    ]);
    const allRefs = all.map(toPlateFoodRef);
    const catalog = rankPlateCatalog(all, recent).map(toPlateFoodRef);
    const draft = await analyzeTextMeal(
      auth.session.userId,
      catalog,
      parsed.data.text,
      allRefs,
    );
    return jsonOk(draft);
  } catch (error) {
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
}
