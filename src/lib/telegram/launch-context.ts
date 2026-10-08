import { telegramLaunchParamsFromLocation } from "@/lib/telegram/launch-hash";

type TelegramInitWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: Record<string, unknown>;
    };
    WebView?: { initParams?: Record<string, string> };
  };
};

/** Launch surface for this open only — not merged session/local storage (stale start_param poisons bot opens). */
function readLiveTelegramLaunchParams(): Record<string, string> {
  const fromWebView =
    (typeof window !== "undefined"
      ? (window as TelegramInitWindow).Telegram?.WebView?.initParams
      : undefined) ?? {};
  const fromLocation = telegramLaunchParamsFromLocation() ?? {};
  return { ...fromLocation, ...fromWebView };
}

function launchInitParam(
  params: Record<string, string>,
  key: string,
): string | undefined {
  const value = params[key]?.trim();
  return value || undefined;
}

/** Bot API: chat_type / chat_instance come from direct Mini App / chat-list opens. */
export function readTelegramInitUnsafe(): Record<string, unknown> {
  if (typeof window === "undefined") {
    return {};
  }
  const webApp = (window as TelegramInitWindow).Telegram?.WebApp;
  const unsafe = webApp?.initDataUnsafe;
  if (unsafe && Object.keys(unsafe).length > 0) {
    return unsafe;
  }

  const raw = webApp?.initData?.trim() ?? "";
  if (!raw) {
    return {};
  }

  const params = new URLSearchParams(raw);
  const parsed: Record<string, unknown> = {};
  for (const key of [
    "chat_type",
    "chat_instance",
    "start_param",
    "query_id",
    "auth_date",
  ]) {
    const value = params.get(key);
    if (value) {
      parsed[key] = value;
    }
  }
  const user = params.get("user");
  if (user) {
    try {
      parsed.user = JSON.parse(user) as unknown;
    } catch {
      parsed.user = user;
    }
  }
  return parsed;
}

export function telegramPlatform(): string {
  if (typeof window === "undefined") {
    return "unknown";
  }
  const fromInit = (window as TelegramInitWindow).Telegram?.WebView
    ?.initParams?.tgWebAppPlatform;
  if (fromInit) {
    return fromInit.toLowerCase();
  }
  return /android/i.test(navigator.userAgent) ? "android" : "unknown";
}

export function isAndroidTelegram(): boolean {
  return telegramPlatform() === "android";
}

/**
 * Keyboard web_app (messages.requestWebView) — кнопка «Открыть дневник» в чате с ботом.
 * Plain miniAppUrl, без start_param и без direct-link полей.
 */
export function isTelegramKeyboardWebAppLaunch(): boolean {
  const unsafe = readTelegramInitUnsafe();
  if (unsafe.chat_type || unsafe.chat_instance) {
    return false;
  }
  const start = unsafe.start_param;
  if (typeof start === "string" && start.trim() !== "") {
    return false;
  }
  const launchParams = readLiveTelegramLaunchParams();
  if (launchInitParam(launchParams, "tgWebAppStartParam")) {
    return false;
  }
  if (
    launchInitParam(launchParams, "tgWebAppFullscreen") === "1" ||
    launchInitParam(launchParams, "tgWebAppFullscreen") === "true"
  ) {
    return false;
  }
  return true;
}

/** Chat list, home screen, t.me/.../app?startapp=… — messages.requestAppWebView. */
export function isTelegramAppWebViewLaunch(): boolean {
  return !isTelegramKeyboardWebAppLaunch();
}
