import type { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { getServerEnv } from "@/lib/env";
import { recordFunnelEvent } from "@/lib/funnel";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import {
  JOY_KINDS,
  joyMomentFromRequest,
  joyShareCaption,
  SHARE_FAILED,
  sanitizeJoyLift,
} from "@/lib/share/joy";
import { joyInlinePhotoResult, joyPhotoOrigin } from "@/lib/share/prepared";
import { createBot, getAppShareUrl } from "@/lib/telegram/bot";
import { SESSION_FEELS } from "@/lib/workout/labels";

const joyShareRequestSchema = z.object({
  kind: z.enum(JOY_KINDS),
  feel: z.enum(SESSION_FEELS).nullable().optional(),
  sessions: z.number().int().min(1).max(10_000).optional(),
  proteinHits: z.number().int().min(0).max(400).optional(),
  lift: z
    .object({
      name: z.string().min(1).max(80),
      kg: z.number().gt(0).lt(1000),
    })
    .nullable()
    .optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, joyShareRequestSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  const moment = joyMomentFromRequest(parsed.data);
  if (!moment) {
    return jsonError(CHECK_FIELDS, 400);
  }

  const lift = moment.allowKg ? sanitizeJoyLift(parsed.data.lift) : null;
  const line = joyShareCaption(moment.line, lift, moment.allowKg);
  const env = getServerEnv();
  const photoOrigin =
    joyPhotoOrigin(env.NEXT_PUBLIC_APP_URL) ??
    joyPhotoOrigin(env.TELEGRAM_MINI_APP_URL);
  const installUrl = await getAppShareUrl();
  if (!photoOrigin || !installUrl) {
    return jsonError(LOAD_FAILED, 404);
  }

  try {
    const prepared = await createBot(env).api.savePreparedInlineMessage(
      auth.session.telegramId,
      joyInlinePhotoResult({
        id: `joy-${moment.kind}`,
        line,
        doodle: moment.doodle,
        photoOrigin,
        installUrl,
      }),
      {
        allow_user_chats: true,
        allow_group_chats: true,
        allow_channel_chats: true,
      },
    );
    await recordFunnelEvent(auth.session.userId, "share");
    return jsonOk({ id: prepared.id });
  } catch (error) {
    console.error(error);
    return jsonError(SHARE_FAILED, 400);
  }
}
