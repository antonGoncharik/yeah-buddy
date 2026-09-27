import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { applyRation } from "@/lib/food/apply-ration";
import { RATION_IDS, RationFoodMissingError } from "@/lib/food/ration";

const rationApplySchema = z.object({
  id: z.enum(RATION_IDS),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, rationApplySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const templates = await applyRation(auth.session.userId, parsed.data.id);
    return jsonOk({ templates });
  } catch (error) {
    return failRoute(error, [whenError(RationFoodMissingError, 400)]);
  }
}
