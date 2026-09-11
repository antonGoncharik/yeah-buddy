import { Bot, GrammyError, InlineKeyboard } from "grammy";

import { getServerEnv, type ServerEnv } from "@/lib/env";
import { BOT_OPEN_DIARY, BOT_START } from "@/lib/messages";
import { isPackToken } from "@/lib/share/token";

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

export function withStartApp(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("startapp", token);
  return parsed.toString();
}

export async function getPackShareUrl(token: string): Promise<string | null> {
  if (!isPackToken(token)) {
    return null;
  }

  const mini = getMiniAppUrl();
  if (mini) {
    try {
      const parsed = new URL(mini);
      if (parsed.hostname === "t.me") {
        return withStartApp(mini, token);
      }
    } catch {
      // fall through to bot username
    }
  }

  const username = await getBotUsername();
  if (username) {
    return `https://t.me/${username}?startapp=${encodeURIComponent(token)}`;
  }

  return mini ? withStartApp(mini, token) : null;
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

    const payload = typeof ctx.match === "string" ? ctx.match.trim() : "";
    const token = isPackToken(payload) ? payload : null;
    const buttonUrl = token ? withStartApp(miniAppUrl, token) : miniAppUrl;

    await ctx.reply(BOT_START, {
      // web_app buttons are URL-only; fullscreen is requested in the Mini App (Bot API 8.0+).
      reply_markup: diaryKeyboard(buttonUrl),
    });
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
