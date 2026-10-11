import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { PackNotFoundError, revokePack } from "@/lib/share/packs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { token } = await context.params;

    try {
      await revokePack(session.userId, token);
      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error, [whenError(PackNotFoundError, 404)]);
    }
  },
);
