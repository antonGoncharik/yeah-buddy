import { getServerEnv, type ServerEnv } from "@/lib/env";
import { getMiniAppUrl } from "@/lib/telegram/bot";
import { resolveAppShareUrl, withStart } from "@/lib/telegram/share-url";

function botUsernameFromEnv(env: ServerEnv): string | null {
  const raw = env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return raw && raw.length > 0 ? raw : null;
}

/** Bot chat URL for static public pages (no getMe). */
export function publicBotChatUrl(
  env: ServerEnv = getServerEnv(),
  startPayload?: string | null,
): string | null {
  const base = resolveAppShareUrl({
    miniAppUrl: getMiniAppUrl(env),
    botUsername: botUsernameFromEnv(env),
  });
  if (!base) {
    return null;
  }
  if (!startPayload) {
    return base;
  }
  return withStart(base, startPayload);
}

export function landingCtaPath(src: string): string {
  const safe = src.trim().toLowerCase().slice(0, 32);
  return `/go?src=${encodeURIComponent(safe || "cta")}`;
}
