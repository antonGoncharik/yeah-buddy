import { jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { APP_SHARE_TEXT } from "@/lib/brand";
import { LOAD_FAILED } from "@/lib/messages";
import { getAppShareUrl } from "@/lib/telegram/bot";

export const GET = sessionRoute(async (_session) => {
  const url = await getAppShareUrl();
  if (!url) {
    return jsonError(LOAD_FAILED, 404);
  }

  return jsonOk({ url, text: APP_SHARE_TEXT });
});
