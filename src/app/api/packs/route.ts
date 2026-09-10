import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
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
    return NextResponse.json({ packs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || !isSharePackKind(parsed.data.kind)) {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  try {
    const pack = await publishLivePack(
      auth.session.userId,
      parsed.data.kind,
      parsed.data.title,
    );
    return NextResponse.json({ pack });
  } catch (error) {
    if (error instanceof PackEmptyError || error instanceof PackLimitError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
