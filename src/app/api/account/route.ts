import type { NextResponse } from "next/server";

import { deleteUserById } from "@/lib/account/delete";
import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { clearSessionCookie } from "@/lib/auth/session";

export async function DELETE(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    await deleteUserById(auth.session.userId);
    await clearSessionCookie();
    return jsonOk({ deleted: true });
  } catch (error) {
    return failRoute(error);
  }
}
