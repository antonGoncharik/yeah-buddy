import type { NextResponse } from "next/server";

import { trackEvent } from "@/lib/analytics/track";
import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { getServerEnv } from "@/lib/env";
import { recordFunnelEvent } from "@/lib/funnel";
import { LOAD_FAILED } from "@/lib/messages";
import {
  encodeMuscleWeekCard,
  MUSCLE_WEEK_CARD_EMPTY,
  muscleWeekCardCaption,
  muscleWeekCardPhotoUrl,
} from "@/lib/share/muscle-week-card";
import { loadMuscleWeekCard } from "@/lib/share/muscle-week-card-load";
import { joyPhotoOrigin, muscleWeekInlineResults } from "@/lib/share/prepared";
import { createBot, getAppShareUrl } from "@/lib/telegram/bot";

export async function POST(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  let card: Awaited<ReturnType<typeof loadMuscleWeekCard>>;
  try {
    card = await loadMuscleWeekCard(auth.session.userId);
  } catch (error) {
    return failRoute(error);
  }
  if (!card) {
    return jsonError(MUSCLE_WEEK_CARD_EMPTY, 400);
  }

  const env = getServerEnv();
  const photoOrigin =
    joyPhotoOrigin(env.NEXT_PUBLIC_APP_URL) ??
    joyPhotoOrigin(env.TELEGRAM_MINI_APP_URL);
  const installUrl = await getAppShareUrl();
  if (!photoOrigin || !installUrl) {
    return jsonError(LOAD_FAILED, 404);
  }

  const query = encodeMuscleWeekCard(card, env.SESSION_SECRET);
  const [result] = muscleWeekInlineResults({
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
  await trackEvent(auth.session.userId, "share_send", {
    channel: "muscle_week",
  });
  const photoUrl = muscleWeekCardPhotoUrl(photoOrigin, query);
  const caption = muscleWeekCardCaption(card);
  return jsonOk({
    id,
    query,
    photo_url: photoUrl,
    caption,
    install_url: installUrl,
  });
}
