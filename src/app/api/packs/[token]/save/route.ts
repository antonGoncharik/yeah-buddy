import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  PackLimitError,
  PackNotFoundError,
  savePackCopy,
} from "@/lib/share/packs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { token } = await context.params;

    try {
      const pack = await savePackCopy(session.userId, token);
      return jsonOk({ pack });
    } catch (error) {
      return failRoute(error, [
        whenError(PackNotFoundError, 404),
        whenError(PackLimitError, 400),
      ]);
    }
  },
);
