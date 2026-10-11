import { z } from "zod";
import { CLIENT_PRODUCT_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";

const bodySchema = z.object({
  event: z.enum(CLIENT_PRODUCT_EVENTS),
  props: z.record(z.string(), z.unknown()).optional(),
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  await trackEvent(session.userId, parsed.data.event, parsed.data.props ?? {});

  return jsonOk({ ok: true });
});
