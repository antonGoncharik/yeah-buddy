import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { recordFunnelEvent } from "@/lib/funnel";
import { CHECK_FIELDS } from "@/lib/messages";
import { isProgramPresetId } from "@/lib/workout/program-presets";
import {
  applyProgramPreset,
  ProgramNotOfferedError,
} from "@/lib/workout/templates";

const bodySchema = z.object({
  preset: z.string(),
  fromStart: z.boolean().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

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
      auth.session.userId,
      parsed.data.preset,
    );
    if (parsed.data.fromStart) {
      await recordFunnelEvent(auth.session.userId, "program_start");
    }
    return jsonOk({ templates });
  } catch (error) {
    return failRoute(error, [whenError(ProgramNotOfferedError, 403)]);
  }
}
