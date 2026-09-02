import { NextResponse } from "next/server";

import { getSession, type SessionPayload } from "@/lib/auth/session";
import { OPEN_VIA_BOT } from "@/lib/messages";

export async function requireSession(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: OPEN_VIA_BOT }, { status: 401 }),
    };
  }

  return { session };
}
