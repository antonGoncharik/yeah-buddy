import {
  DONATE_CURRENCY,
  DONATE_DESCRIPTION,
  DONATE_PRICE_LABEL,
  DONATE_TITLE,
  donateInvoicePayload,
  isDonateInvoiceUrl,
  parseDonateStars,
} from "@/lib/donate/amount";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import { createBot } from "@/lib/telegram/bot";

export async function createDonateInvoiceLink(stars: number): Promise<string> {
  if (parseDonateStars(String(stars)) !== stars) {
    throw new Error(CHECK_FIELDS);
  }

  const url = await createBot().api.createInvoiceLink(
    DONATE_TITLE,
    DONATE_DESCRIPTION,
    donateInvoicePayload(stars),
    "",
    DONATE_CURRENCY,
    [{ label: DONATE_PRICE_LABEL, amount: stars }],
  );

  if (!isDonateInvoiceUrl(url)) {
    throw new Error(LOAD_FAILED);
  }

  return url;
}
