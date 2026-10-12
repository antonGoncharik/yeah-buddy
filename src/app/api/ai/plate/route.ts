import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import { analyzePlate } from "@/lib/ai/plate";
import { rankPlateCatalog, toPlateFoodRef } from "@/lib/ai/plate-catalog";
import { readPlateImagePart } from "@/lib/ai/plate-image";
import { trackAiRequest } from "@/lib/analytics/ai";
import { rateLimitUser } from "@/lib/api/rate-limit";
import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { listFoods } from "@/lib/food/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = sessionRoute(async (session, request) => {
  const limited = rateLimitUser(session.userId, "ai", 5, 60_000);
  if (limited) {
    return limited;
  }

  const image = await readPlateImagePart(request);
  if (!image.ok) {
    return jsonError(image.error, 400);
  }

  try {
    const [all, recent] = await Promise.all([
      listFoods(session.userId, "all"),
      listFoods(session.userId, "recent"),
    ]);
    const allRefs = all.map(toPlateFoodRef);
    const catalog = rankPlateCatalog(all, recent).map(toPlateFoodRef);
    const draft = await analyzePlate(session.userId, catalog, image, allRefs);
    await trackAiRequest(session.userId, "plate", true);
    return jsonOk(draft);
  } catch (error) {
    await trackAiRequest(session.userId, "plate", false);
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
