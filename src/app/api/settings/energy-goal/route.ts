import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  applyEnergyGoal,
  dismissEnergyGoal,
} from "@/lib/nutrition/energy-goal-save";

const bodySchema = z.object({
  action: z.enum(["apply", "dismiss"]),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const result =
      parsed.data.action === "apply"
        ? await applyEnergyGoal(auth.session.userId)
        : await dismissEnergyGoal(auth.session.userId);
    if (!result) {
      return jsonError("Настройки не нашлись.", 404);
    }
    return jsonOk(result);
  } catch (error) {
    return failRoute(error);
  }
}
