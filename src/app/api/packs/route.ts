import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
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

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const packs = await listOwnedPacks(auth.session.userId);
    return jsonOk({ packs });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

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
            auth.session.userId,
            {
              mealId: parsed.data.mealId,
              namedMealId: parsed.data.namedMealId,
            },
            parsed.data.title,
          )
        : await publishLivePack(
            auth.session.userId,
            parsed.data.kind,
            parsed.data.title,
          );
    await recordFunnelEvent(auth.session.userId, "share");
    return jsonOk({ pack });
  } catch (error) {
    return failRoute(error, [
      whenError(PackEmptyError, 400),
      whenError(PackLimitError, 400),
    ]);
  }
}
