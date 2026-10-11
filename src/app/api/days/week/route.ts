import { jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { listWeek } from "@/lib/day/week-load";

export const GET = sessionRoute(async (session) => {
  return jsonOk(await listWeek(session.userId));
});
