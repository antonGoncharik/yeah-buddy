import { Bot, GrammyError, InlineKeyboard } from "grammy";

import { getServerEnv, type ServerEnv } from "@/lib/env";
import {
  BOT_OPEN_DIARY,
  BOT_PACK_START,
  BOT_START,
  BOT_YEAH_BUDDY,
} from "@/lib/messages";
import { joyInlineResults, joyPhotoOrigin } from "@/lib/share/prepared";
import { isPackToken } from "@/lib/share/token";
import {
  resolveAppShareUrl,
  resolvePackShareUrl,
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

export function createBot(env: ServerEnv = getServerEnv()): Bot {
  if (bot) {
    return bot;
  }

  const instance = new Bot(env.TELEGRAM_BOT_TOKEN);

  instance.command("start", async (ctx) => {
    await replyStartSticker(ctx);

    const miniAppUrl = getMiniAppUrl();
    if (!miniAppUrl) {
      await ctx.reply(BOT_START);
      return;
    }

    const payload = typeof ctx.match === "string" ? ctx.match.trim() : "";
    const token = isPackToken(payload) ? payload : null;
    const buttonUrl = token ? withStartApp(miniAppUrl, token) : miniAppUrl;

    if (token) {
      const { packBotReply } = await import("@/lib/share/pack-meta");
      const reply = await packBotReply(token);
      if (reply) {
        await ctx.reply(reply.text, {
          reply_markup: new InlineKeyboard().webApp(BOT_PACK_START, buttonUrl),
        });
        return;
      }
    }

    await ctx.reply(BOT_START, {
      // web_app buttons are URL-only; fullscreen is requested in the Mini App (Bot API 8.0+).
      reply_markup: diaryKeyboard(buttonUrl),
    });
  });

  instance.command("yeah", async (ctx) => {
    await ctx.reply(BOT_YEAH_BUDDY);
  });

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
      joyInlineResults({
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
    await createBot(env).api.sendMessage(
      chatId,
      text,
      miniAppUrl ? { reply_markup: diaryKeyboard(miniAppUrl) } : {},
    );
    return "sent";
  } catch (error) {
    if (error instanceof GrammyError && isBlockedChat(error)) {
      return "blocked";
    }
    console.error(error);
    return "failed";
  }
}

function diaryKeyboard(url: string): InlineKeyboard {
  return new InlineKeyboard().webApp(BOT_OPEN_DIARY, url);
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
