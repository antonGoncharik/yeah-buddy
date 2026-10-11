import { failRoute, jsonOk, readHistoryQuery } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { listDayHistory } from "@/lib/days";

export const GET = sessionRoute(async (session, request) => {
  const query = readHistoryQuery(request);
  if (!query.ok) {
    return query.response;
  }

  try {
    const page = await listDayHistory(session.userId, {
      before: query.before,
      limit: query.limit,
    });
    return jsonOk(page);
  } catch (error) {
    return failRoute(error);
  }
});
