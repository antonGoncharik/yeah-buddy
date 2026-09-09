import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { createFood, listFoods } from "@/lib/food/store";
import { foodInputSchema, parseFoodListFilter } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const filter = parseFoodListFilter(
    new URL(request.url).searchParams.get("filter"),
  );

  try {
    const foods = await listFoods(auth.session.userId, filter);
    return NextResponse.json({ foods });
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

  const parsed = foodInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  try {
    const food = await createFood(auth.session.userId, parsed.data);
    return NextResponse.json({ food });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
