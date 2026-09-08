import { Bot, type Context, InlineKeyboard } from "grammy";

import { ReviewError } from "@/lib/ai/errors";
import {
  createReview,
  getReviewSnapshot,
  getReviewUserIdByTelegram,
  parseReviewRange,
} from "@/lib/ai/review";
import { formatReviewMessage } from "@/lib/ai/text";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import {
  AI_REVIEW_EMPTY,
  AI_REVIEW_FAILED,
  BOT_OPEN_DIARY,
  BOT_REVIEW_NEED_APP,
  BOT_START,
} from "@/lib/messages";

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

  instance.command("razbor", (ctx) => replyReview(ctx));
  instance.command("review", (ctx) => replyReview(ctx));

  bot = instance;
  return instance;
}

async function replyReview(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  if (telegramId == null) {
    await ctx.reply(BOT_REVIEW_NEED_APP);
    return;
  }

  const raw = typeof ctx.match === "string" ? ctx.match.trim() : "";
  const range = parseReviewRange(raw || "14") ?? 14;
  const userId = await getReviewUserIdByTelegram(telegramId);
  if (!userId) {
    await ctx.reply(BOT_REVIEW_NEED_APP);
    return;
  }

  await ctx.replyWithChatAction("typing");

  try {
    const preview = await getReviewSnapshot(userId, range);
    if (preview.brief.coverage === "empty") {
      await ctx.reply(AI_REVIEW_EMPTY);
      return;
    }

    if (!preview.configured) {
      const facts = preview.brief.signals.join("\n");
      await ctx.reply(clipMessage(facts || AI_REVIEW_EMPTY));
      return;
    }

    const snapshot = await createReview(userId, range);
    if (!snapshot.review) {
      await ctx.reply(clipMessage(preview.brief.signals.join("\n")));
      return;
    }

    await ctx.reply(clipMessage(formatReviewMessage(snapshot.review)));
  } catch (error) {
    if (error instanceof ReviewError) {
      await ctx.reply(error.message);
      return;
    }
    console.error(error);
    await ctx.reply(AI_REVIEW_FAILED);
  }
}

function clipMessage(text: string): string {
  if (text.length <= 4000) {
    return text;
  }
  return `${text.slice(0, 3997)}…`;
}
