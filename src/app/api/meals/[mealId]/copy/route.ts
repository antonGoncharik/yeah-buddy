import { z } from "zod";

import { mealCopyFailures } from "@/lib/api/meal-copy-errors";
import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  copyMealFromDate,
  isIsoDate,
  SourceDayMissingError,
  SourceMealEmptyError,
  YesterdayMealEmptyError,
  YesterdayMissingError,
} from "@/lib/days";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

const bodySchema = z.object({
  sourceDate: z.string(),
  replace: z.boolean().optional(),
});

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { mealId } = await context.params;

    const parsed = await parseJsonSchema(request, bodySchema, (data) =>
      isIsoDate(data.sourceDate),
    );
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const day = await copyMealFromDate(
        session.userId,
        mealId,
        parsed.data.sourceDate,
        parsed.data.replace ?? false,
      );
      return jsonOk({ day });
    } catch (error) {
      return failRoute(
        error,
        mealCopyFailures([
          whenError(YesterdayMissingError, 404),
          whenError(SourceDayMissingError, 404),
          whenError(YesterdayMealEmptyError, 404),
          whenError(SourceMealEmptyError, 404),
        ]),
      );
    }
  },
);
