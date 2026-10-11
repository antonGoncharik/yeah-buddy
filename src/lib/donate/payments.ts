import type { Bot } from "grammy";

import { donateCheckoutOk, parseDonatePayload } from "@/lib/donate/amount";
import { findUserIdByTelegramId, recordDonation } from "@/lib/donate/record";
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

    const stars = parseDonatePayload(payment.invoice_payload);
    const telegramId = ctx.from?.id;
    if (stars != null && telegramId != null) {
      const userId = await findUserIdByTelegramId(telegramId);
      if (userId) {
        await recordDonation({
          userId,
          stars,
          telegramPaymentChargeId: payment.telegram_payment_charge_id,
        });
      }
    }

    try {
      await ctx.reply(DONATE_THANKS);
    } catch (error) {
      console.error(error);
    }
  });
}
