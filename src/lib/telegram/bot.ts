import { join } from "node:path";

import { Bot, GrammyError, InlineKeyboard, InputFile } from "grammy";

import { registerDonatePayments } from "@/lib/donate/payments";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import {
  classifyStart,
  inboxMenuStartPayload,
  readInboxChatId,
} from "@/lib/inbox/letter";
import { openInboxStart, registerInbox } from "@/lib/inbox/register";
import {
  BOT_OPEN_DIARY,
  BOT_PACK_START,
  BOT_PROGRAM_START,
  BOT_START,
  BOT_YEAH_BUDDY,
} from "@/lib/messages";
import { type JoyDoodle, joyPhotoPath, SHARE_TO_CHAT } from "@/lib/share/joy";
import { botInlineResults, joyPhotoOrigin } from "@/lib/share/prepared";
import {
  type FeaturedProgramId,
  featuredProgramPreset,
  programChatMessage,
  programStartPayload,
} from "@/lib/share/program-start";
import {
  resolveAppShareUrl,
  resolvePackShareUrl,
  resolveProgramShareUrl,
  telegramBotChatUrl,
  withStart,
  withStartApp,
} from "@/lib/telegram/share-url";
import { replyStartSticker, trexStickerFileId } from "@/lib/telegram/sticker";

let bot: Bot | null = null;
let botUsername: string | null | undefined;

export function getMiniAppUrl(env: ServerEnv = getServerEnv()): string | null {
  const candidate = env.TELEGRAM_MINI_APP_URL || env.NEXT_PUBLIC_APP_URL;
  if (!candidate) {
    return null;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:") {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}

export { withStartApp } from "@/lib/telegram/share-url";

export async function getAppShareUrl(
  env: ServerEnv = getServerEnv(),
): Promise<string | null> {
  return resolveAppShareUrl({
    miniAppUrl: getMiniAppUrl(env),
    botUsername: await getBotUsername(),
  });
}

export async function getPackShareUrl(token: string): Promise<string | null> {
  return resolvePackShareUrl(token, await getAppShareUrl());
}

export async function getProgramShareUrl(
  id: FeaturedProgramId,
): Promise<string | null> {
  return resolveProgramShareUrl(id, await getAppShareUrl());
}

export async function getInboxOpenUrl(
  env: ServerEnv = getServerEnv(),
): Promise<string | null> {
  if (readInboxChatId(env.INBOX_CHAT_ID) == null) {
    return null;
  }

  const share = await getAppShareUrl(env);
  if (!share) {
    return null;
  }

  const chat = telegramBotChatUrl(share);
  if (!chat) {
    return null;
  }

  return withStart(chat, inboxMenuStartPayload());
}

export function createBot(env: ServerEnv = getServerEnv()): Bot {
  if (bot) {
    return bot;
  }

  const instance = new Bot(env.TELEGRAM_BOT_TOKEN);

  instance.command("start", async (ctx) => {
    const payload = typeof ctx.match === "string" ? ctx.match.trim() : "";
    const start = classifyStart(payload);
    if (start.kind === "inbox") {
      await openInboxStart(ctx, start.topic);
      return;
    }

    await replyStartSticker(ctx);

    const miniAppUrl = getMiniAppUrl();
    if (!miniAppUrl) {
      await ctx.reply(BOT_START);
      return;
    }

    if (start.kind === "program") {
      const buttonUrl = withStartApp(miniAppUrl, programStartPayload(start.id));
      await ctx.reply(programChatMessage(featuredProgramPreset(start.id)), {
        reply_markup: new InlineKeyboard().webApp(BOT_PROGRAM_START, buttonUrl),
      });
      return;
    }

    const buttonUrl =
      start.kind === "pack"
        ? withStartApp(miniAppUrl, start.token)
        : miniAppUrl;

    if (start.kind === "pack") {
      const { packBotReply } = await import("@/lib/share/pack-meta");
      const reply = await packBotReply(start.token);
      if (reply) {
        await ctx.reply(reply.text, {
          reply_markup: new InlineKeyboard().webApp(BOT_PACK_START, buttonUrl),
        });
        return;
      }
    }

    await ctx.reply(BOT_START, {
      // web_app buttons are URL-only; fullscreen is requested in the Mini App (Bot API 8.0+).
      ...replyMarkup(buttonUrl),
    });
  });

  instance.command("yeah", async (ctx) => {
    await ctx.reply(BOT_YEAH_BUDDY);
  });

  registerDonatePayments(instance);
  registerInbox(instance);

  instance.on("inline_query", async (ctx) => {
    const env = getServerEnv();
    const photoOrigin =
      joyPhotoOrigin(env.NEXT_PUBLIC_APP_URL) ??
      joyPhotoOrigin(env.TELEGRAM_MINI_APP_URL);
    const installUrl = await getAppShareUrl(env);
    if (!photoOrigin || !installUrl) {
      await ctx.answerInlineQuery([]);
      return;
    }

    await ctx.answerInlineQuery(
      botInlineResults({
        query: ctx.inlineQuery.query,
        photoOrigin,
        installUrl,
        stickerFileId: trexStickerFileId(),
      }),
      { cache_time: 15, is_personal: false },
    );
  });

  bot = instance;
  return instance;
}

export type DiarySendResult = "sent" | "blocked" | "failed";

export async function sendDiaryMessage(
  chatId: number,
  text: string,
  env: ServerEnv = getServerEnv(),
): Promise<DiarySendResult> {
  const miniAppUrl = getMiniAppUrl(env);
  try {
    await createBot(env).api.sendMessage(chatId, text, replyMarkup(miniAppUrl));
    return "sent";
  } catch (error) {
    return diarySendError(error);
  }
}

export async function sendDiaryPhoto(
  chatId: number,
  input: {
    doodle: JoyDoodle;
    caption: string;
    inlineQuery?: string | null;
  },
  env: ServerEnv = getServerEnv(),
): Promise<DiarySendResult> {
  const miniAppUrl = getMiniAppUrl(env);
  try {
    await createBot(env).api.sendPhoto(chatId, shareDoodleFile(input.doodle), {
      caption: input.caption,
      ...replyMarkup(miniAppUrl, input.inlineQuery),
    });
    return "sent";
  } catch (error) {
    return diarySendError(error);
  }
}

function shareDoodleFile(doodle: JoyDoodle): InputFile {
  return new InputFile(
    join(process.cwd(), "public", joyPhotoPath(doodle).slice(1)),
  );
}

function replyMarkup(
  miniAppUrl: string | null,
  inlineQuery?: string | null,
): { reply_markup: InlineKeyboard } | Record<string, never> {
  if (!miniAppUrl && !inlineQuery) {
    return {};
  }

  const keyboard = new InlineKeyboard();
  if (miniAppUrl) {
    keyboard.webApp(BOT_OPEN_DIARY, miniAppUrl);
  }
  if (inlineQuery) {
    if (miniAppUrl) {
      keyboard.row();
    }
    keyboard.switchInline(SHARE_TO_CHAT, inlineQuery);
  }
  return { reply_markup: keyboard };
}

function diarySendError(error: unknown): DiarySendResult {
  if (error instanceof GrammyError && isBlockedChat(error)) {
    return "blocked";
  }
  console.error(error);
  return "failed";
}

function isBlockedChat(error: GrammyError): boolean {
  if (error.error_code === 403) {
    return true;
  }
  if (error.error_code !== 400) {
    return false;
  }
  const description = error.description.toLowerCase();
  return (
    description.includes("chat not found") ||
    description.includes("user is deactivated")
  );
}

async function getBotUsername(): Promise<string | null> {
  if (botUsername !== undefined) {
    return botUsername;
  }

  try {
    const me = await createBot().api.getMe();
    botUsername = me.username ?? null;
  } catch {
    botUsername = null;
  }

  return botUsername;
}
