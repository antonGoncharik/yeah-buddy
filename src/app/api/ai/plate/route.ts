import type { NextResponse } from "next/server";

import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import { analyzePlate } from "@/lib/ai/plate";
import { rankPlateCatalog, toPlateFoodRef } from "@/lib/ai/plate-catalog";
import { readPlateImagePart } from "@/lib/ai/plate-image";
import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { listFoods } from "@/lib/food/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const image = await readPlateImagePart(request);
  if (!image.ok) {
    return jsonError(image.error, 400);
  }

  try {
    const [all, recent] = await Promise.all([
      listFoods(auth.session.userId, "all"),
      listFoods(auth.session.userId, "recent"),
    ]);
    const allRefs = all.map(toPlateFoodRef);
    const catalog = rankPlateCatalog(all, recent).map(toPlateFoodRef);
    const draft = await analyzePlate(
      auth.session.userId,
      catalog,
      image,
      allRefs,
    );
    return jsonOk(draft);
  } catch (error) {
    return failRoute(error, [
      (err) =>
        err instanceof ReviewError
          ? jsonError(err.message, reviewStatus(err.code))
          : null,
    ]);
  }
}
