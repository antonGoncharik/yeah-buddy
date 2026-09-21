import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { DONATE_MAX, DONATE_MIN } from "@/lib/donate/amount";
import { createDonateInvoiceLink } from "@/lib/donate/invoice";
import { CHECK_FIELDS } from "@/lib/messages";

const bodySchema = z.object({
  stars: z.number().int().min(DONATE_MIN).max(DONATE_MAX),
});

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
    const url = await createDonateInvoiceLink(parsed.data.stars);
    return jsonOk({ url });
  } catch (error) {
    return failRoute(error, [whenMessage(CHECK_FIELDS, 400)]);
  }
}
