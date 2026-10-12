import type { Bot, Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { formatBodyWeight, parseBodyWeight } from "@/lib/day/body-weight";
import { setBodyWeight } from "@/lib/day/body-weight-store";
import { createDayFromTemplate } from "@/lib/day/create";
import { PastDayLockedError } from "@/lib/day/dates";
import { getDayByDate } from "@/lib/day/store";
import { getUserCalendarToday } from "@/lib/day/writable";
import { DONATE_PRESETS } from "@/lib/donate/amount";
import { createDonateInvoiceLink } from "@/lib/donate/invoice";
import type { ServerEnv } from "@/lib/env";
import { findMealChatUser } from "@/lib/meal-chat/user";
import {
  BOT_HELP,
  BOT_OPEN_DIARY,
  BOT_OPEN_SETTINGS,
  BOT_OPEN_WEEK,
  BOT_WEIGHT_RECORDED,
  BOT_WEIGHT_USAGE,
  BOT_WEIGHT_WRITE_LOCKED,
} from "@/lib/messages";
import { getUserSettings } from "@/lib/settings";
import { resolveDayTypeForUser } from "@/lib/settings/gym-mode";
import { getMiniAppUrl } from "@/lib/telegram/bot";

export function registerBotCommands(bot: Bot, env: ServerEnv): void {
  bot.command("today", async (ctx) => {
    await openMiniApp(ctx, env, BOT_OPEN_DIARY);
  });

  bot.command("settings", async (ctx) => {
    await openMiniApp(ctx, env, BOT_OPEN_SETTINGS);
  });

  bot.command("week", async (ctx) => {
    await openMiniApp(ctx, env, BOT_OPEN_WEEK);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(BOT_HELP);
  });

  bot.command("donate", async (ctx) => {
    try {
      const stars = DONATE_PRESETS[0];
      const url = await createDonateInvoiceLink(stars);
      await ctx.reply("Счёт на звёзды — по кнопке.", {
        reply_markup: new InlineKeyboard().url("Оплатить звёздами", url),
      });
    } catch (error) {
      console.error(error);
    }
  });

  bot.command("weight", async (ctx) => {
    if (!ctx.from) {
      return;
    }
    const raw = typeof ctx.match === "string" ? ctx.match.trim() : "";
    const numeric = Number(raw.replace(",", "."));
    const kg = parseBodyWeight(Number.isFinite(numeric) ? numeric : null);
    if (kg == null) {
      await ctx.reply(BOT_WEIGHT_USAGE);
      return;
    }

    const user = await findMealChatUser(ctx.from.id);
    if (!user) {
      await openMiniApp(ctx, env, BOT_OPEN_DIARY);
      return;
    }

    try {
      const today = await getUserCalendarToday(user.userId);
      let day = await getDayByDate(user.userId, today);
      if (!day) {
        const settings = await getUserSettings(user.userId);
        const dayType = resolveDayTypeForUser(settings, "rest");
        day = await createDayFromTemplate(user.userId, today, dayType);
      }
      await setBodyWeight(user.userId, day.id, kg);
      await ctx.reply(BOT_WEIGHT_RECORDED(formatBodyWeight(kg)));
    } catch (error) {
      if (error instanceof PastDayLockedError) {
        await ctx.reply(BOT_WEIGHT_WRITE_LOCKED);
        return;
      }
      console.error(error);
    }
  });
}

async function openMiniApp(
  ctx: Context,
  env: ServerEnv,
  label: string,
): Promise<void> {
  const miniAppUrl = getMiniAppUrl(env);
  if (!miniAppUrl) {
    await ctx.reply(BOT_HELP);
    return;
  }
  await ctx.reply(label, {
    reply_markup: new InlineKeyboard().webApp(label, miniAppUrl),
  });
}
