import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { NEED_ALL_WORKING_WEIGHTS } from "@/lib/messages";
import {
  CycleEmptyError,
  createFirstMacro,
  createMacroSchema,
  getCurrentMacroState,
  MacroConflictError,
  NoExercisesError,
} from "@/lib/workout/macros";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const state = await getCurrentMacroState(auth.session.userId);
    return jsonOk(state);
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, createMacroSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const state = await createFirstMacro(auth.session.userId, parsed.data);
    return jsonOk(state);
  } catch (error) {
    return failRoute(error, [
      whenError(MacroConflictError, 409),
      whenError(NoExercisesError, 409),
      whenError(CycleEmptyError, 409),
      whenMessage(NEED_ALL_WORKING_WEIGHTS, 400),
    ]);
  }
}
