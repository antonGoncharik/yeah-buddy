import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import type { MuscleId } from "@/lib/types";
import { MUSCLE_IDS } from "@/lib/workout/muscle-taxonomy";
import { easeSoreSession } from "@/lib/workout/sore-apply";

const schema = z.object({
  muscles: z
    .array(z.enum(MUSCLE_IDS as [MuscleId, ...MuscleId[]]))
    .min(1)
    .max(8),
});

type RouteContext = { params: Promise<{ id: string }> };

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;
    const parsed = await parseJsonSchema(request, schema);
    if (!parsed.ok) {
      return parsed.response;
    }
    try {
      const detail = await easeSoreSession(
        session.userId,
        id,
        parsed.data.muscles,
      );
      if (!detail) {
        return jsonError("Тренировка не найдена.", 404);
      }
      return jsonOk(detail);
    } catch (error) {
      return failRoute(error);
    }
  },
);
