import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = skipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const template = await getTemplate(
      auth.session.userId,
      parsed.data.template_id,
    );
    if (!template) {
      return NextResponse.json({ error: "Шаблон не найден." }, { status: 404 });
    }

    await skipTemplateInRotation(auth.session.userId, template.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
