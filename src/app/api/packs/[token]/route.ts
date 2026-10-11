import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { getPackDetail, PackNotFoundError } from "@/lib/share/packs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { token } = await context.params;

    try {
      const pack = await getPackDetail(session.userId, token);
      return jsonOk({ pack });
    } catch (error) {
      return failRoute(error, [whenError(PackNotFoundError, 404)]);
    }
  },
);
