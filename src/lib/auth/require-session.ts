import type { NextResponse } from "next/server";

import { jsonError } from "@/lib/api/respond";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import { OPEN_VIA_BOT } from "@/lib/messages";

export async function requireSession(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      response: jsonError(OPEN_VIA_BOT, 401),
    };
  }

  return { session };
}
