import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { foodInputSchema, mapFood } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/types";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const filter = new URL(request.url).searchParams.get("filter");

  try {
    if (filter === "recent") {
      const foods = await listRecentFoods(auth.session.userId);
      return NextResponse.json({ foods });
    }

    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("foods")
      .select("*")
      .eq("user_id", auth.session.userId)
      .order("name", { ascending: true });

    if (filter === "favorites") {
      query = query.eq("is_favorite", true);
    }

    const result = await query;
    if (result.error) {
      throw result.error;
    }

    const foods = (result.data ?? []).map((row) =>
      mapFood(row as Record<string, unknown>),
    );
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
    const inserted = await supabase
      .from("foods")
      .insert({
        user_id: auth.session.userId,
        ...parsed.data,
      })
      .select("*")
      .single();

    if (inserted.error || !inserted.data) {
      throw inserted.error ?? new Error("Food insert failed");
    }

    return NextResponse.json({
      food: mapFood(inserted.data as Record<string, unknown>),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

async function listRecentFoods(userId: string): Promise<Food[]> {
  const supabase = createSupabaseServerClient();
  const items = await supabase
    .from("meal_items")
    .select("food_id, created_at")
    .eq("user_id", userId)
    .not("food_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (items.error) {
    throw items.error;
  }

  const foodIds: string[] = [];
  for (const item of items.data ?? []) {
    if (typeof item.food_id !== "string") {
      continue;
    }
    if (!foodIds.includes(item.food_id)) {
      foodIds.push(item.food_id);
    }
  }

  if (foodIds.length === 0) {
    return [];
  }

  const foods = await supabase
    .from("foods")
    .select("*")
    .eq("user_id", userId)
    .in("id", foodIds);

  if (foods.error) {
    throw foods.error;
  }

  const byId = new Map(
    (foods.data ?? []).map((row) => {
      const food = mapFood(row as Record<string, unknown>);
      return [food.id, food];
    }),
  );

  return foodIds.flatMap((id) => {
    const food = byId.get(id);
    return food ? [food] : [];
  });
}
