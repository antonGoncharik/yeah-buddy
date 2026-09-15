import type { NextResponse } from "next/server";

import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { searchCatalogFoods } from "@/lib/food/catalog-store";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const foods = await searchCatalogFoods(auth.session.userId, query);
    return jsonOk({ foods });
  } catch (error) {
    return failRoute(error);
  }
}
