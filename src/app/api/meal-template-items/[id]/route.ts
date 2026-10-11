import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  deleteTemplateItem,
  FoodNotFoundError,
  getTemplateItem,
  MealTemplateItemNotFoundError,
  templateItemGramsSchema,
  updateTemplateItemGrams,
} from "@/lib/meal-templates";
import { NOT_FOUND } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const item = await getTemplateItem(session.userId, id);
      if (!item) {
        return jsonError(NOT_FOUND, 404);
      }

      return jsonOk({ item });
    } catch (error) {
      return failRoute(error, [
        (err) =>
          err instanceof FoodNotFoundError ? jsonError(NOT_FOUND, 404) : null,
      ]);
    }
  },
);

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;

    const parsed = await parseJsonSchema(request, templateItemGramsSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const item = await updateTemplateItemGrams(
        session.userId,
        id,
        parsed.data.grams,
      );
      return jsonOk({ item });
    } catch (error) {
      return failRoute(error, [
        (err) =>
          err instanceof MealTemplateItemNotFoundError ||
          err instanceof FoodNotFoundError
            ? jsonError(NOT_FOUND, 404)
            : null,
      ]);
    }
  },
);

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const deleted = await deleteTemplateItem(session.userId, id);
      if (!deleted) {
        return jsonError(NOT_FOUND, 404);
      }

      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error);
    }
  },
);
