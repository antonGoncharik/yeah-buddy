import type { Bot } from "grammy";

import { donateCheckoutOk } from "@/lib/donate/amount";
import { DONATE_REJECT, DONATE_THANKS } from "@/lib/messages";

export function registerDonatePayments(bot: Bot): void {
  bot.on("pre_checkout_query", async (ctx) => {
    const query = ctx.preCheckoutQuery;
    const ok = donateCheckoutOk({
      currency: query.currency,
      totalAmount: query.total_amount,
      payload: query.invoice_payload,
    });
    if (!ok) {
      await ctx.answerPreCheckoutQuery(false, DONATE_REJECT);
      return;
    }
    await ctx.answerPreCheckoutQuery(true);
  });

  bot.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;
    if (
      !donateCheckoutOk({
        currency: payment.currency,
        totalAmount: payment.total_amount,
        payload: payment.invoice_payload,
      })
    ) {
      return;
    }

    try {
      await ctx.reply(DONATE_THANKS);
    } catch (error) {
      console.error(error);
    }
  });
}
