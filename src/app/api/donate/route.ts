import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
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

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    return jsonOk({ open: !authorPaysSelf(auth.session.telegramId) });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    if (authorPaysSelf(auth.session.telegramId)) {
      return jsonError(DONATE_REJECT, 403);
    }

    const url = await createDonateInvoiceLink(parsed.data.stars);
    return jsonOk({ url });
  } catch (error) {
    return failRoute(error, [whenMessage(CHECK_FIELDS, 400)]);
  }
}
