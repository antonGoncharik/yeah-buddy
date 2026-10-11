import { analyzeDictate } from "@/lib/ai/dictate";
import { readDictateAudioPart } from "@/lib/ai/dictate-audio";
import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import { rankPlateCatalog, toPlateFoodRef } from "@/lib/ai/plate-catalog";
import { trackAiRequest } from "@/lib/analytics/ai";
import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { listFoods } from "@/lib/food/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = sessionRoute(async (session, request) => {
  const audio = await readDictateAudioPart(request);
  if (!audio.ok) {
    return jsonError(audio.error, 400);
  }

  try {
    const [all, recent] = await Promise.all([
      listFoods(session.userId, "all"),
      listFoods(session.userId, "recent"),
    ]);
    const allRefs = all.map(toPlateFoodRef);
    const catalog = rankPlateCatalog(all, recent).map(toPlateFoodRef);
    const draft = await analyzeDictate(session.userId, catalog, audio, allRefs);
    await trackAiRequest(session.userId, "dictate", true);
    return jsonOk(draft);
  } catch (error) {
    await trackAiRequest(session.userId, "dictate", false);
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
