import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { loadBuddyBoard } from "@/lib/buddy/board";
import { BuddyNotFoundError } from "@/lib/buddy/errors";
import { isBuddyGrantId } from "@/lib/buddy/id";
import { revokeBuddyGrant } from "@/lib/buddy/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;
    if (!isBuddyGrantId(id)) {
      return failRoute(new BuddyNotFoundError(), [
        whenError(BuddyNotFoundError, 404),
      ]);
    }

    try {
      const board = await loadBuddyBoard(session.userId, id);
      return jsonOk({ board });
    } catch (error) {
      return failRoute(error, [whenError(BuddyNotFoundError, 404)]);
    }
  },
);

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;
    if (!isBuddyGrantId(id)) {
      return failRoute(new BuddyNotFoundError(), [
        whenError(BuddyNotFoundError, 404),
      ]);
    }

    try {
      await revokeBuddyGrant(session.userId, id);
      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error, [whenError(BuddyNotFoundError, 404)]);
    }
  },
);
