import type { NextResponse } from "next/server";
import { z } from "zod";
import { CLIENT_PRODUCT_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";

const bodySchema = z.object({
  event: z.enum(CLIENT_PRODUCT_EVENTS),
  props: z.record(z.string(), z.unknown()).optional(),
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

  await trackEvent(
    auth.session.userId,
    parsed.data.event,
    parsed.data.props ?? {},
  );

  return jsonOk({ ok: true });
}
