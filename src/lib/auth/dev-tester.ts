import type { SessionPayload } from "@/lib/auth/session";

export const DEV_TELEGRAM_ID = -1;

/** Local dev session or non-production Mini App host. */
export function isDevTester(session: SessionPayload | null): boolean {
  if (!session) {
    return false;
  }
  if (session.telegramId === DEV_TELEGRAM_ID) {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}
