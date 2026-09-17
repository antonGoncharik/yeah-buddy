import { isPackToken } from "@/lib/share/token";

/** Short startapp so a bot-only t.me link opens the Mini App, not the chat. */
export const APP_INVITE_STARTAPP = "open";

export function isTelegramMeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "t.me" || parsed.hostname === "www.t.me")
    );
  } catch {
    return false;
  }
}

export function withStartApp(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("startapp", token);
  return parsed.toString();
}

/** Direct Mini App path stays as-is; a bare bot link gets startapp=open. */
export function ensureMiniAppLaunchUrl(url: string): string {
  if (!isTelegramMeUrl(url)) {
    return url;
  }

  const parsed = new URL(url);
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return url;
  }
  if (!parsed.searchParams.has("startapp")) {
    parsed.searchParams.set("startapp", APP_INVITE_STARTAPP);
  }
  return parsed.toString();
}

export function resolveAppShareUrl(input: {
  miniAppUrl: string | null;
  botUsername: string | null;
}): string | null {
  const mini = input.miniAppUrl;
  if (mini && isTelegramMeUrl(mini)) {
    return ensureMiniAppLaunchUrl(mini);
  }
  if (input.botUsername) {
    return ensureMiniAppLaunchUrl(`https://t.me/${input.botUsername}`);
  }
  return mini;
}

export function resolvePackShareUrl(
  token: string,
  appUrl: string | null,
): string | null {
  if (!appUrl || !isPackToken(token)) {
    return null;
  }

  return withStartApp(appUrl, token);
}
