import type { NextResponse } from "next/server";
import { exportUserAccount } from "@/lib/account/export";
import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const dump = await exportUserAccount(auth.session.userId);
    return jsonOk({ export: dump });
  } catch (error) {
    return failRoute(error);
  }
}
