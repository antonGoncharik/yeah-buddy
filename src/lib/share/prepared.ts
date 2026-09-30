import type {
  InlineQueryResult,
  InlineQueryResultArticle,
  InlineQueryResultPhoto,
} from "grammy/types";

import { YEAH_BUDDY_LINE } from "@/lib/flavor";
import { BOT_PROGRAM_START } from "@/lib/messages";
import {
  type BarbellShareFacts,
  barbellShareCaption,
  barbellShareTitle,
  barbellTeaserCaption,
  matchBarbellInlineSearch,
  parseBarbellInlineQuery,
} from "@/lib/share/barbell-daily";
import { dayShareCard, parseDayInlineQuery } from "@/lib/share/day";
import {
  BOT_INSTALL_DIARY,
  type JoyDoodle,
  joyMomentFromRequest,
  joyPhotoPath,
  joyShareCaption,
  parseJoyInlineQuery,
  sanitizeJoyLift,
} from "@/lib/share/joy";
import {
  featuredProgramPreset,
  matchFeaturedPrograms,
  programChatMessage,
  programShareText,
} from "@/lib/share/program-start";
import {
  decodeWeekCard,
  encodeWeekCard,
  WEEK_CARD_BUTTON,
  WEEK_CARD_HEADING,
  weekCardCaption,
  weekCardPhotoUrl,
  weekCardSize,
} from "@/lib/share/week-card";
import { publicHttpOrigin } from "@/lib/site-url";
import {
  resolveBarbellPlayUrl,
  resolveProgramShareUrl,
} from "@/lib/telegram/share-url";

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
  title?: string;
}): InlineQueryResultPhoto {
  const photo = joyPhotoUrl(input.photoOrigin, input.doodle);
  return {
    type: "photo",
    id: input.id,
    photo_url: photo,
    thumbnail_url: photo,
    photo_width: 512,
    photo_height: 512,
    title: input.title ?? input.line,
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

export function programInlineResults(input: {
  query: string;
  installUrl: string;
}): InlineQueryResultArticle[] {
  const results: InlineQueryResultArticle[] = [];
  for (const id of matchFeaturedPrograms(input.query)) {
    const url = resolveProgramShareUrl(id, input.installUrl);
    if (!url) {
      continue;
    }
    const preset = featuredProgramPreset(id);
    results.push({
      type: "article",
      id: `program-${id}`,
      title: preset.name,
      description: programShareText(preset),
      input_message_content: {
        message_text: programChatMessage(preset),
      },
      reply_markup: {
        inline_keyboard: [[{ text: BOT_PROGRAM_START, url }]],
      },
    });
  }
  return results;
}

export function barbellInlineResults(input: {
  facts?: BarbellShareFacts | null;
  query?: string;
  photoOrigin: string;
  installUrl: string;
  miniAppUrl?: string | null;
}): InlineQueryResultPhoto[] {
  const facts =
    input.facts ?? (input.query ? parseBarbellInlineQuery(input.query) : null);
  if (!facts) {
    return [];
  }

  const line = barbellShareCaption(facts);
  const playUrl =
    resolveBarbellPlayUrl({
      miniAppUrl: input.miniAppUrl ?? null,
      appUrl: input.installUrl,
    }) ?? input.installUrl;
  const photo = joyPhotoUrl(input.photoOrigin, "trex");
  const keyboard = [[{ text: BOT_INSTALL_DIARY, url: input.installUrl }]];
  if (playUrl !== input.installUrl) {
    keyboard.push([{ text: "Собрать штангу", url: playUrl }]);
  }
  return [
    {
      type: "photo",
      id: `barbell-${facts.targetKg}-${facts.moves}`,
      photo_url: photo,
      thumbnail_url: photo,
      photo_width: 512,
      photo_height: 512,
      title: barbellShareTitle(facts),
      caption: line,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    },
  ];
}

export function barbellTeaserInlineResult(input: {
  photoOrigin: string;
  installUrl: string;
  miniAppUrl?: string | null;
}): InlineQueryResultPhoto {
  const playUrl =
    resolveBarbellPlayUrl({
      miniAppUrl: input.miniAppUrl ?? null,
      appUrl: input.installUrl,
    }) ?? input.installUrl;
  const photo = joyPhotoUrl(input.photoOrigin, "trex");
  return {
    type: "photo",
    id: "barbell-teaser",
    photo_url: photo,
    thumbnail_url: photo,
    photo_width: 512,
    photo_height: 512,
    title: "Собери штангу",
    caption: barbellTeaserCaption(),
    reply_markup: {
      inline_keyboard:
        playUrl === input.installUrl
          ? [[{ text: BOT_INSTALL_DIARY, url: input.installUrl }]]
          : [
              [{ text: "Собрать штангу", url: playUrl }],
              [{ text: BOT_INSTALL_DIARY, url: input.installUrl }],
            ],
    },
  };
}

export function dayInlineResults(input: {
  query: string;
  photoOrigin: string;
  installUrl: string;
}): InlineQueryResultPhoto[] {
  const parsed = parseDayInlineQuery(input.query);
  if (!parsed) {
    return [];
  }

  const card = dayShareCard(parsed.facts);
  return [
    joyInlinePhotoResult({
      id: `day-${parsed.facts.gym}`,
      line: card,
      title: card.replaceAll("\n", " · "),
      doodle: parsed.doodle,
      photoOrigin: input.photoOrigin,
      installUrl: input.installUrl,
    }),
  ];
}

export function weekInlineResults(input: {
  query: string;
  photoOrigin: string;
  installUrl: string;
  secret: string;
}): InlineQueryResultPhoto[] {
  const card = decodeWeekCard(input.query, input.secret);
  if (!card) {
    return [];
  }

  const query = encodeWeekCard(card, input.secret);
  const photo = weekCardPhotoUrl(input.photoOrigin, query);
  const size = weekCardSize(card);
  return [
    {
      type: "photo",
      id: `week-${card.to}`,
      photo_url: photo,
      thumbnail_url: photo,
      photo_width: size.width,
      photo_height: size.height,
      title: WEEK_CARD_HEADING,
      caption: weekCardCaption(card),
      reply_markup: {
        inline_keyboard: [[{ text: WEEK_CARD_BUTTON, url: input.installUrl }]],
      },
    },
  ];
}

export function botInlineResults(input: {
  query: string;
  photoOrigin: string;
  installUrl: string;
  miniAppUrl?: string | null;
  stickerFileId: string | null;
  weekSecret?: string | null;
}): InlineQueryResult[] {
  if (input.query.trim().startsWith("wk|")) {
    if (!input.weekSecret) {
      return [];
    }
    return weekInlineResults({
      query: input.query,
      photoOrigin: input.photoOrigin,
      installUrl: input.installUrl,
      secret: input.weekSecret,
    });
  }

  if (parseJoyInlineQuery(input.query)) {
    return joyInlineResults(input);
  }

  const barbell = parseBarbellInlineQuery(input.query);
  if (barbell) {
    return barbellInlineResults({
      facts: barbell,
      photoOrigin: input.photoOrigin,
      installUrl: input.installUrl,
      miniAppUrl: input.miniAppUrl,
    });
  }

  const day = dayInlineResults(input);
  if (day.length > 0) {
    return day;
  }

  const programs = programInlineResults({
    query: input.query,
    installUrl: input.installUrl,
  });
  if (input.query.trim() !== "" && programs.length > 0) {
    return programs;
  }

  if (matchBarbellInlineSearch(input.query)) {
    return [
      barbellTeaserInlineResult({
        photoOrigin: input.photoOrigin,
        installUrl: input.installUrl,
        miniAppUrl: input.miniAppUrl,
      }),
      ...programs,
      ...joyInlineResults(input),
    ];
  }

  return [...programs, ...joyInlineResults(input)];
}
