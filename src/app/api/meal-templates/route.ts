import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { listMealTemplates } from "@/lib/meal-templates";
import { LOAD_FAILED } from "@/lib/messages";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const templates = await listMealTemplates(auth.session.userId);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
