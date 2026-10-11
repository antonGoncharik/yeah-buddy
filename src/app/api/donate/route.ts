import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { DONATE_MAX, DONATE_MIN } from "@/lib/donate/amount";
import { createDonateInvoiceLink } from "@/lib/donate/invoice";
import { getServerEnv } from "@/lib/env";
import { isInboxAuthor } from "@/lib/inbox/letter";
import { CHECK_FIELDS, DONATE_REJECT } from "@/lib/messages";

const bodySchema = z.object({
  stars: z.number().int().min(DONATE_MIN).max(DONATE_MAX),
});

function authorPaysSelf(telegramId: number): boolean {
  return isInboxAuthor(telegramId, getServerEnv().INBOX_CHAT_ID);
}

export const GET = sessionRoute(async (session) => {
  return jsonOk({ open: !authorPaysSelf(session.telegramId) });
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    if (authorPaysSelf(session.telegramId)) {
      return jsonError(DONATE_REJECT, 403);
    }

    const url = await createDonateInvoiceLink(parsed.data.stars);
    return jsonOk({ url });
  } catch (error) {
    return failRoute(error, [whenMessage(CHECK_FIELDS, 400)]);
  }
});
