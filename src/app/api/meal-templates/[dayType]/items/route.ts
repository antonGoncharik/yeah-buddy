import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  addTemplateItem,
  FoodNotFoundError,
  reorderTemplateItems,
  TemplateMealHiddenError,
  templateItemReorderSchema,
  templateItemWriteSchema,
} from "@/lib/meal-templates";
import { CHECK_FIELDS } from "@/lib/messages";
import { isDayType } from "@/lib/nutrition";
import { OrderMismatchError } from "@/lib/order";

type RouteContext = {
  params: Promise<{ dayType: string }>;
};

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { dayType } = await context.params;
    if (!isDayType(dayType)) {
      return jsonError(CHECK_FIELDS, 400);
    }

    const parsed = await parseJsonSchema(request, templateItemWriteSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const item = await addTemplateItem(session.userId, dayType, parsed.data);
      return jsonOk({ item });
    } catch (error) {
      return failRoute(error, [
        whenError(TemplateMealHiddenError, 400),
        whenError(FoodNotFoundError, 404),
      ]);
    }
  },
);

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { dayType } = await context.params;
    if (!isDayType(dayType)) {
      return jsonError(CHECK_FIELDS, 400);
    }

    const parsed = await parseJsonSchema(request, templateItemReorderSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const template = await reorderTemplateItems(
        session.userId,
        dayType,
        parsed.data.mealType,
        parsed.data.itemIds,
      );
      return jsonOk({ template });
    } catch (error) {
      return failRoute(error, [
        whenError(TemplateMealHiddenError, 400),
        whenError(OrderMismatchError, 400),
      ]);
    }
  },
);
