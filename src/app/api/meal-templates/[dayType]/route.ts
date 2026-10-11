import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { ensureMealTemplate } from "@/lib/meal-templates";
import { CHECK_FIELDS } from "@/lib/messages";
import { isDayType } from "@/lib/nutrition";

type RouteContext = {
  params: Promise<{ dayType: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { dayType } = await context.params;
    if (!isDayType(dayType)) {
      return jsonError(CHECK_FIELDS, 400);
    }

    try {
      const template = await ensureMealTemplate(session.userId, dayType);
      return jsonOk({ template });
    } catch (error) {
      return failRoute(error);
    }
  },
);
