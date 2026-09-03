import { Bot, InlineKeyboard } from "grammy";

import { getServerEnv, type ServerEnv } from "@/lib/env";
import { BOT_OPEN_DIARY, BOT_START } from "@/lib/messages";

let bot: Bot | null = null;

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

export function createBot(env: ServerEnv = getServerEnv()): Bot {
  if (bot) {
    return bot;
  }

  const instance = new Bot(env.TELEGRAM_BOT_TOKEN);

  instance.command("start", async (ctx) => {
    const miniAppUrl = getMiniAppUrl();
    if (!miniAppUrl) {
      await ctx.reply(BOT_START);
      return;
    }

    await ctx.reply(BOT_START, {
      reply_markup: new InlineKeyboard().webApp(BOT_OPEN_DIARY, miniAppUrl),
    });
  });

  bot = instance;
  return instance;
}
