import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { recordFunnelEvent } from "@/lib/funnel";
import { CHECK_FIELDS } from "@/lib/messages";
import { syncTrainingCarbsToProgram } from "@/lib/nutrition/training-day";
import { isProgramPresetId } from "@/lib/workout/program-presets";
import {
  applyProgramPreset,
  ProgramNotOfferedError,
} from "@/lib/workout/templates";

const bodySchema = z.object({
  preset: z.string(),
  fromStart: z.boolean().optional(),
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, bodySchema, (data) =>
    isProgramPresetId(data.preset),
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  if (!isProgramPresetId(parsed.data.preset)) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const templates = await applyProgramPreset(
      session.userId,
      parsed.data.preset,
    );
    await syncTrainingCarbsToProgram(session.userId, parsed.data.preset);
    if (parsed.data.fromStart) {
      await recordFunnelEvent(session.userId, "program_start");
    }
    return jsonOk({ templates });
  } catch (error) {
    return failRoute(error, [whenError(ProgramNotOfferedError, 403)]);
  }
});
