import type { InlineQueryResult, InlineQueryResultPhoto } from "grammy/types";

import { YEAH_BUDDY_LINE } from "@/lib/flavor";
import {
  BOT_INSTALL_DIARY,
  type JoyDoodle,
  joyMomentFromRequest,
  joyPhotoPath,
  joyShareCaption,
  parseJoyInlineQuery,
  sanitizeJoyLift,
} from "@/lib/share/joy";
import { publicHttpOrigin } from "@/lib/site-url";

export function joyPhotoOrigin(
  value: string | null | undefined,
): string | null {
  const origin = publicHttpOrigin(value);
  if (origin?.protocol !== "https:") {
    return null;
  }
  return origin.origin;
}

export function joyPhotoUrl(origin: string, doodle: JoyDoodle): string {
  return `${origin}${joyPhotoPath(doodle)}`;
}

export function joyInlinePhotoResult(input: {
  id: string;
  line: string;
  doodle: JoyDoodle;
  photoOrigin: string;
  installUrl: string;
}): InlineQueryResultPhoto {
  const photo = joyPhotoUrl(input.photoOrigin, input.doodle);
  return {
    type: "photo",
    id: input.id,
    photo_url: photo,
    thumbnail_url: photo,
    photo_width: 512,
    photo_height: 512,
    title: input.line,
    caption: input.line,
    reply_markup: {
      inline_keyboard: [[{ text: BOT_INSTALL_DIARY, url: input.installUrl }]],
    },
  };
}

export function joyInlineResults(input: {
  query: string;
  photoOrigin: string;
  installUrl: string;
  stickerFileId: string | null;
}): InlineQueryResult[] {
  const parsed = parseJoyInlineQuery(input.query);
  const request = parsed ?? { kind: "session" as const, feel: "easy" as const };
  const moment = joyMomentFromRequest(request);
  const results: InlineQueryResult[] = [];

  if (parsed == null && input.stickerFileId) {
    results.push({
      type: "sticker",
      id: "joy-sticker",
      sticker_file_id: input.stickerFileId,
      reply_markup: {
        inline_keyboard: [[{ text: BOT_INSTALL_DIARY, url: input.installUrl }]],
      },
    });
  }

  if (moment) {
    const lift = moment.allowKg ? sanitizeJoyLift(request.lift) : null;
    results.push(
      joyInlinePhotoResult({
        id: `joy-${moment.kind}`,
        line: joyShareCaption(moment.line, lift, moment.allowKg),
        doodle: moment.doodle,
        photoOrigin: input.photoOrigin,
        installUrl: input.installUrl,
      }),
    );
  } else {
    results.push(
      joyInlinePhotoResult({
        id: "joy-yeah",
        line: YEAH_BUDDY_LINE,
        doodle: "trex",
        photoOrigin: input.photoOrigin,
        installUrl: input.installUrl,
      }),
    );
  }

  return results;
}
