import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { getUserCalendarToday } from "@/lib/day/writable";
import { listPortionChips } from "@/lib/food/portion-log";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;
    try {
      const today = await getUserCalendarToday(session.userId);
      const chips = await listPortionChips(session.userId, id, today);
      if (!chips) {
        return jsonError("Продукт не найден.", 404);
      }
      return jsonOk({ chips });
    } catch (error) {
      return failRoute(error);
    }
  },
);
