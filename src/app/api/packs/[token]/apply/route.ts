import { trackEvent } from "@/lib/analytics/track";
import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  NamedMealEmptyError,
  NamedMealLimitError,
} from "@/lib/named-meal/errors";
import {
  applyPack,
  PackEmptyError,
  PackLimitError,
  PackNotFoundError,
} from "@/lib/share/packs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export const POST = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { token } = await context.params;

    try {
      const pack = await applyPack(session.userId, token);
      await trackEvent(session.userId, "pack_apply", { kind: pack.kind });
      return jsonOk({ pack });
    } catch (error) {
      return failRoute(error, [
        whenError(PackNotFoundError, 404),
        whenError(PackEmptyError, 400),
        whenError(PackLimitError, 400),
        whenError(NamedMealEmptyError, 400),
        whenError(NamedMealLimitError, 400),
      ]);
    }
  },
);
