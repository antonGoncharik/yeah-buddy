import type { NextResponse } from "next/server";
import { analyzeDictate } from "@/lib/ai/dictate";
import { readDictateAudioPart } from "@/lib/ai/dictate-audio";
import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import { rankPlateCatalog, toPlateFoodRef } from "@/lib/ai/plate-catalog";
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

  const audio = await readDictateAudioPart(request);
  if (!audio.ok) {
    return jsonError(audio.error, 400);
  }

  try {
    const [all, recent] = await Promise.all([
      listFoods(auth.session.userId, "all"),
      listFoods(auth.session.userId, "recent"),
    ]);
    const allRefs = all.map(toPlateFoodRef);
    const catalog = rankPlateCatalog(all, recent).map(toPlateFoodRef);
    const draft = await analyzeDictate(
      auth.session.userId,
      catalog,
      audio,
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
