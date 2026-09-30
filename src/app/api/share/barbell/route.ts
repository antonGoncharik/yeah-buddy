import type { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { getServerEnv } from "@/lib/env";
import { recordFunnelEvent } from "@/lib/funnel";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import {
  barbellInlineQuery,
  barbellShareCaption,
} from "@/lib/share/barbell-daily";
import { barbellInlineResults, joyPhotoOrigin } from "@/lib/share/prepared";
import { createBot, getAppShareUrl, getMiniAppUrl } from "@/lib/telegram/bot";
import { dailyChallenge, minMovesForTarget } from "@/lib/workout/barbell-daily";

const barbellShareSchema = z.object({
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetKg: z.number().gt(0).lt(500),
  moves: z.number().int().min(1).max(40),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, barbellShareSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { dayKey, targetKg, moves } = parsed.data;
  const challenge = dailyChallenge(dayKey);
  if (!challenge || challenge.targetKg !== targetKg) {
    return jsonError(CHECK_FIELDS, 400);
  }

  const par = minMovesForTarget(targetKg);
  if (par == null || moves < par) {
    return jsonError(CHECK_FIELDS, 400);
  }

  const env = getServerEnv();
  const photoOrigin =
    joyPhotoOrigin(env.NEXT_PUBLIC_APP_URL) ??
    joyPhotoOrigin(env.TELEGRAM_MINI_APP_URL);
  const installUrl = await getAppShareUrl();
  if (!photoOrigin || !installUrl) {
    return jsonError(LOAD_FAILED, 404);
  }

  const facts = { dayKey, targetKg, moves };
  const query = barbellInlineQuery(facts);
  const [result] = barbellInlineResults({
    facts,
    photoOrigin,
    installUrl,
    miniAppUrl: getMiniAppUrl(env),
  });
  if (!result) {
    return jsonError(LOAD_FAILED, 404);
  }

  let id: string | null = null;
  try {
    const prepared = await createBot(env).api.savePreparedInlineMessage(
      auth.session.telegramId,
      result,
      {
        allow_user_chats: true,
        allow_group_chats: true,
        allow_channel_chats: true,
      },
    );
    id = prepared.id;
  } catch (error) {
    console.error(error);
  }

  await recordFunnelEvent(auth.session.userId, "share");
  return jsonOk({
    id,
    query,
    photo_url: result.photo_url,
    caption: barbellShareCaption(facts),
    install_url: installUrl,
  });
}
