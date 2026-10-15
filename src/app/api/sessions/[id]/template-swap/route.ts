import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import {
  keepSwapInTemplate,
  templateSlotSwapSchema,
} from "@/lib/workout/template-slot-swap";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;
    const parsed = await parseJsonSchema(request, templateSlotSwapSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const ok = await keepSwapInTemplate(
        session.userId,
        id,
        parsed.data.fromExerciseId,
        parsed.data.exerciseId,
      );
      if (!ok) {
        return jsonError("Тренировка не найдена.", 404);
      }
      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error, [
        whenMessage("У этой тренировки нет шаблона.", 400),
        whenMessage("Это упражнение уже стоит в шаблоне.", 400),
        whenMessage("В шаблоне нет этого упражнения.", 400),
      ]);
    }
  },
);
