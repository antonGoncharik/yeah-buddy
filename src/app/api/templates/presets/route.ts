import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
import { isProgramPresetId } from "@/lib/workout/program-presets";
import { applyProgramPreset } from "@/lib/workout/templates";

const bodySchema = z.object({
  preset: z.string(),
});

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
  if (!parsed.success || !isProgramPresetId(parsed.data.preset)) {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  try {
    const templates = await applyProgramPreset(
      auth.session.userId,
      parsed.data.preset,
    );
    return NextResponse.json({ templates });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
