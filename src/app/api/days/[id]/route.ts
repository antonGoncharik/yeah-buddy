import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { parseBodyWeight, parseWaist } from "@/lib/day/body-weight";
import {
  PastDayLockedError,
  setBodyWeight,
  setDayType,
  setWaist,
} from "@/lib/days";
import { CHECK_FIELDS } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z
  .object({
    dayType: z.enum(["rest", "training"]).optional(),
    bodyWeight: z.number().finite().nullable().optional(),
    waistCm: z.number().finite().nullable().optional(),
  })
  .refine(
    (data) =>
      data.dayType !== undefined ||
      data.bodyWeight !== undefined ||
      data.waistCm !== undefined,
  );

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const parsed = await parseJsonSchema(request, bodySchema, (data) => {
    if (data.bodyWeight != null && parseBodyWeight(data.bodyWeight) == null) {
      return false;
    }
    if (data.waistCm != null && parseWaist(data.waistCm) == null) {
      return false;
    }
    return true;
  });
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    let day = null;
    if (parsed.data.dayType !== undefined) {
      day = await setDayType(auth.session.userId, id, parsed.data.dayType);
    }
    if (parsed.data.bodyWeight !== undefined) {
      day = await setBodyWeight(
        auth.session.userId,
        id,
        parsed.data.bodyWeight,
      );
    }
    if (parsed.data.waistCm !== undefined) {
      day = await setWaist(auth.session.userId, id, parsed.data.waistCm);
    }
    if (!day) {
      return jsonError(CHECK_FIELDS, 400);
    }
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenMessage("Day not found", 404, "День не найден."),
      whenMessage(CHECK_FIELDS, 400),
    ]);
  }
}
