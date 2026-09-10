import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { WORKOUT_NOT_FOUND } from "@/lib/messages";
import {
  getTemplate,
  templateWriteSchema,
  updateTemplate,
} from "@/lib/workout/templates";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const template = await getTemplate(auth.session.userId, id);
    if (!template) {
      return jsonError(WORKOUT_NOT_FOUND, 404);
    }

    return jsonOk({ template });
  } catch (error) {
    return failRoute(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const parsed = await parseJsonSchema(request, templateWriteSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const template = await updateTemplate(auth.session.userId, id, parsed.data);
    if (!template) {
      return jsonError(WORKOUT_NOT_FOUND, 404);
    }

    return jsonOk({ template });
  } catch (error) {
    return failRoute(error);
  }
}
