import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { getServerEnv } from "@/lib/env";
import { recordFunnelEvent } from "@/lib/funnel";
import { LOAD_FAILED } from "@/lib/messages";
import { joyPhotoOrigin, weekInlineResults } from "@/lib/share/prepared";
import {
  encodeWeekCard,
  WEEK_CARD_EMPTY,
  weekCardCaption,
  weekCardPhotoUrl,
} from "@/lib/share/week-card";
import { loadWeekCard } from "@/lib/share/week-card-load";
import { createBot, getAppShareUrl } from "@/lib/telegram/bot";

export async function POST(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  let card: Awaited<ReturnType<typeof loadWeekCard>>;
  try {
    card = await loadWeekCard(auth.session.userId);
  } catch (error) {
    return failRoute(error);
  }
  if (!card) {
    return jsonError(WEEK_CARD_EMPTY, 400);
  }

  const env = getServerEnv();
  const photoOrigin =
    joyPhotoOrigin(env.NEXT_PUBLIC_APP_URL) ??
    joyPhotoOrigin(env.TELEGRAM_MINI_APP_URL);
  const installUrl = await getAppShareUrl();
  if (!photoOrigin || !installUrl) {
    return jsonError(LOAD_FAILED, 404);
  }

  const query = encodeWeekCard(card, env.SESSION_SECRET);
  const [result] = weekInlineResults({
    query,
    photoOrigin,
    installUrl,
    secret: env.SESSION_SECRET,
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
    photo_url: weekCardPhotoUrl(photoOrigin, query),
    caption: weekCardCaption(card),
    install_url: installUrl,
  });
}
