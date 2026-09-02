import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { mapFood } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  is_favorite: z.boolean(),
});

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const updated = await supabase
      .from("foods")
      .update({ is_favorite: parsed.data.is_favorite })
      .eq("id", id)
      .eq("user_id", auth.session.userId)
      .select("*")
      .maybeSingle();

    if (updated.error) {
      throw updated.error;
    }

    if (!updated.data) {
      return NextResponse.json(
        { error: "Продукт не найден." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      food: mapFood(updated.data as Record<string, unknown>),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
