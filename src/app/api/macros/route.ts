import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { NEED_ALL_WORKING_WEIGHTS } from "@/lib/messages";
import {
  CycleEmptyError,
  createFirstMacro,
  createMacroSchema,
  getCurrentMacroState,
  MacroConflictError,
  NoExercisesError,
} from "@/lib/workout/macros";

export const GET = sessionRoute(async (session) => {
  const state = await getCurrentMacroState(session.userId);
  return jsonOk(state);
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, createMacroSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const state = await createFirstMacro(session.userId, parsed.data);
    return jsonOk(state);
  } catch (error) {
    return failRoute(error, [
      whenError(MacroConflictError, 409),
      whenError(NoExercisesError, 409),
      whenError(CycleEmptyError, 409),
      whenMessage(NEED_ALL_WORKING_WEIGHTS, 400),
    ]);
  }
});
