import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { WORKOUT_NOT_FOUND } from "@/lib/messages";
import { skipTemplateInRotation } from "@/lib/workout/settings";
import { getTemplate } from "@/lib/workout/templates";

const skipSchema = z.object({
  template_id: z.string().uuid(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, skipSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const template = await getTemplate(
      auth.session.userId,
      parsed.data.template_id,
    );
    if (!template) {
      return jsonError(WORKOUT_NOT_FOUND, 404);
    }

    await skipTemplateInRotation(auth.session.userId, template.id);
    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error);
  }
}
