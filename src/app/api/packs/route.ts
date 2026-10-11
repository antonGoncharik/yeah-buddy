import { z } from "zod";
import { trackEvent } from "@/lib/analytics/track";
import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { recordFunnelEvent } from "@/lib/funnel";
import { CHECK_FIELDS } from "@/lib/messages";
import {
  listOwnedPacks,
  PackEmptyError,
  PackLimitError,
  publishLivePack,
  publishMealPack,
} from "@/lib/share/packs";
import { isSharePackKind } from "@/lib/share/payload";

const bodySchema = z.object({
  kind: z.string(),
  title: z.string().trim().max(60).optional(),
  mealId: z.string().trim().min(1).optional(),
  namedMealId: z.string().trim().min(1).optional(),
});

function isPublishBody(data: z.infer<typeof bodySchema>): boolean {
  if (!isSharePackKind(data.kind)) {
    return false;
  }
  if (data.kind !== "meal") {
    return true;
  }
  return Boolean(data.mealId) !== Boolean(data.namedMealId);
}

export const GET = sessionRoute(async (session) => {
  const packs = await listOwnedPacks(session.userId);
  return jsonOk({ packs });
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, bodySchema, isPublishBody);
  if (!parsed.ok) {
    return parsed.response;
  }

  if (!isSharePackKind(parsed.data.kind)) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const pack =
      parsed.data.kind === "meal"
        ? await publishMealPack(
            session.userId,
            {
              mealId: parsed.data.mealId,
              namedMealId: parsed.data.namedMealId,
            },
            parsed.data.title,
          )
        : await publishLivePack(
            session.userId,
            parsed.data.kind,
            parsed.data.title,
          );
    await recordFunnelEvent(session.userId, "share");
    await trackEvent(session.userId, "share_publish", {
      kind: parsed.data.kind,
    });
    return jsonOk({ pack });
  } catch (error) {
    return failRoute(error, [
      whenError(PackEmptyError, 400),
      whenError(PackLimitError, 400),
    ]);
  }
});
