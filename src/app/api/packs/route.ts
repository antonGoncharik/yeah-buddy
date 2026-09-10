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
import { CHECK_FIELDS } from "@/lib/messages";
import {
  listOwnedPacks,
  PackEmptyError,
  PackLimitError,
  publishLivePack,
} from "@/lib/share/packs";
import { isSharePackKind } from "@/lib/share/payload";

const bodySchema = z.object({
  kind: z.string(),
  title: z.string().trim().max(60).optional(),
});

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const packs = await listOwnedPacks(auth.session.userId);
    return jsonOk({ packs });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, bodySchema, (data) =>
    isSharePackKind(data.kind),
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  if (!isSharePackKind(parsed.data.kind)) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const pack = await publishLivePack(
      auth.session.userId,
      parsed.data.kind,
      parsed.data.title,
    );
    return jsonOk({ pack });
  } catch (error) {
    return failRoute(error, [
      whenError(PackEmptyError, 400),
      whenError(PackLimitError, 400),
    ]);
  }
}
