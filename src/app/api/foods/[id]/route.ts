import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { foodInputSchema, mapFood } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    const food = await getOwnedFood(auth.session.userId, id);
    if (!food) {
      return NextResponse.json(
        { error: "Продукт не найден." },
        { status: 404 },
      );
    }

    return NextResponse.json({ food });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = foodInputSchema.safeParse(body);
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
      .update(parsed.data)
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

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const supabase = createSupabaseServerClient();
    const deleted = await supabase
      .from("foods")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.session.userId)
      .select("id")
      .maybeSingle();

    if (deleted.error) {
      throw deleted.error;
    }

    if (!deleted.data) {
      return NextResponse.json(
        { error: "Продукт не найден." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

async function getOwnedFood(userId: string, id: string) {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("foods")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapFood(result.data as Record<string, unknown>);
}
