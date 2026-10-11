import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { deleteMealChatDraft, readMealChatDraft } from "@/lib/meal-chat/store";
import { NOT_FOUND } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;
    try {
      const draft = await readMealChatDraft(session.userId, id);
      if (!draft) {
        return jsonError(NOT_FOUND, 404);
      }

      return jsonOk({
        mealId: draft.mealId,
        date: draft.date,
        items: draft.items,
      });
    } catch (error) {
      return failRoute(error, []);
    }
  },
);

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;
    try {
      await deleteMealChatDraft(session.userId, id);
      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error, []);
    }
  },
);
