import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { loadBodyCompare } from "@/lib/body/compare-load";
import { isIsoDate } from "@/lib/day/dates";
import { CHECK_FIELDS } from "@/lib/messages";

export const GET = sessionRoute(async (session, request) => {
  const params = new URL(request.url).searchParams;
  const thenDate = params.get("then") ?? "";
  const nowDate = params.get("now") ?? "";
  if (!isIsoDate(thenDate) || !isIsoDate(nowDate) || thenDate > nowDate) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const caption = await loadBodyCompare(session.userId, thenDate, nowDate);
    return jsonOk({ caption });
  } catch (error) {
    return failRoute(error);
  }
});
