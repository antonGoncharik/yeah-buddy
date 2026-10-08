import {
  TELEGRAM_INIT_LOCAL_STORAGE_KEY,
  TELEGRAM_INIT_RELOAD_FLAG,
  telegramInitParamsFromHash,
  telegramLaunchHashFromParams,
} from "@/lib/telegram/boot-script";
import { clearHapticApiCache } from "@/lib/telegram/haptic";
import { telegramLaunchParamsFromLocation } from "@/lib/telegram/launch-hash";

export const TELEGRAM_INIT_PARAMS_STORAGE_KEY = "__telegram__initParams";
export { TELEGRAM_INIT_LOCAL_STORAGE_KEY };

const INIT_RELOAD_FLAG = TELEGRAM_INIT_RELOAD_FLAG;
const TELEGRAM_SDK_WAIT_MS = 2_500;

export type TelegramInitParams = Record<string, string>;

export type TelegramWebAppHost = {
  ready: () => void;
  expand?: () => void;
  initData?: string;
  initDataUnsafe?: { start_param?: string };
  isVersionAtLeast?: (version: string) => boolean;
  openTelegramLink?: (
    url: string,
    options?: { force_request?: boolean },
  ) => void;
  shareMessage?: (id: string, callback?: (sent: boolean) => void) => void;
  switchInlineQuery?: (query: string, chooseChatTypes?: string[]) => void;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => unknown;
    notificationOccurred: (type: "success" | "warning" | "error") => unknown;
    selectionChanged: () => unknown;
  };
};

type TelegramWindow = Window & {
  TelegramWebviewProxy?: { postEvent?: (name: string, data: string) => void };
  external?: { notify?: (payload: string) => void };
  Telegram?: {
    WebView?: { initParams?: TelegramInitParams };
    WebApp?: TelegramWebAppHost;
  };
};

let webAppLoad: Promise<TelegramWebAppHost> | undefined;

export function readStoredTelegramInitParams(): TelegramInitParams | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(TELEGRAM_INIT_PARAMS_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as TelegramInitParams;
  } catch {
    return null;
  }
}

export function persistTelegramLaunchParams(
  params: TelegramInitParams,
): TelegramInitParams | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = readStoredTelegramInitParams();
  const merged = { ...stored, ...params };
  if (!merged.tgWebAppData && !merged.tgWebAppVersion) {
    return null;
  }
  try {
    const serialized = JSON.stringify(merged);
    window.sessionStorage.setItem(TELEGRAM_INIT_PARAMS_STORAGE_KEY, serialized);
    window.localStorage.setItem(TELEGRAM_INIT_LOCAL_STORAGE_KEY, serialized);
  } catch {
    return null;
  }
  return merged;
}

export function hydrateTelegramLaunchStorageFromLocal(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (window.sessionStorage.getItem(TELEGRAM_INIT_PARAMS_STORAGE_KEY)) {
      return;
    }
    const local = window.localStorage.getItem(TELEGRAM_INIT_LOCAL_STORAGE_KEY);
    if (!local) {
      return;
    }
    window.sessionStorage.setItem(TELEGRAM_INIT_PARAMS_STORAGE_KEY, local);
  } catch {
    // Private mode / disabled storage.
  }
}

export function captureTelegramLaunchFromLocation(): TelegramInitParams | null {
  if (typeof window === "undefined") {
    return null;
  }
  hydrateTelegramLaunchStorageFromLocal();
  const fromLocation = telegramLaunchParamsFromLocation();
  if (fromLocation) {
    return persistTelegramLaunchParams(fromLocation);
  }
  return readStoredTelegramInitParams();
}

/** Put launch params back into the URL hash before @twa-dev/sdk reads location.hash once. */
export function restoreTelegramLaunchHashFromStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (telegramInitParamsFromHash(window.location.hash)) {
    return false;
  }
  const stored = readStoredTelegramInitParams();
  if (!stored) {
    return false;
  }
  const hash = telegramLaunchHashFromParams(stored);
  if (!hash) {
    return false;
  }
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  try {
    window.history.replaceState(window.history.state, "", url);
    return true;
  } catch {
    return false;
  }
}

/** Must run synchronously before the first dynamic import of @twa-dev/sdk. */
export function ensureTelegramSdkPrimed(): void {
  if (typeof window === "undefined") {
    return;
  }
  hydrateTelegramLaunchStorageFromLocal();
  captureTelegramLaunchFromLocation();
  restoreTelegramLaunchHashFromStorage();
}

export function isTelegramNativeHost(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const host = window as TelegramWindow;
  return Boolean(
    host.TelegramWebviewProxy?.postEvent ||
      (host.external && typeof host.external.notify === "function"),
  );
}

export function telegramInlineShareAvailable(): boolean {
  const host = window as TelegramWindow;
  const flag = host.Telegram?.WebView?.initParams?.tgWebAppBotInline;
  return flag === "1" || flag === "true";
}

export function telegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * One soft reload when Telegram attached launch params after the SDK already booted.
 */
export function recoverTelegramInitOnce(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (window.sessionStorage.getItem(INIT_RELOAD_FLAG) === "1") {
    return false;
  }

  const hashParams = telegramInitParamsFromHash(window.location.hash);
  const stored = readStoredTelegramInitParams();
  const hasLaunch =
    Boolean(hashParams?.tgWebAppData) || Boolean(stored?.tgWebAppData);
  if (!hasLaunch) {
    return false;
  }

  const host = window as TelegramWindow;
  const initData = host.Telegram?.WebApp?.initData ?? "";
  if (initData.length > 0) {
    return false;
  }

  try {
    window.sessionStorage.setItem(INIT_RELOAD_FLAG, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export function clearTelegramInitReloadFlag(): void {
  try {
    window.sessionStorage.removeItem(INIT_RELOAD_FLAG);
  } catch {
    // sessionStorage may be blocked in a rare WebView.
  }
}

function resolveTelegramWebAppHost(): TelegramWebAppHost {
  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  if (!webApp) {
    throw new Error("telegram webapp unavailable");
  }
  return webApp;
}

type TelegramLifecycleHost = TelegramWebAppHost & {
  onEvent?: (event: string, callback: () => void) => void;
};

function primeTelegramWebAppHost(webApp: TelegramWebAppHost): TelegramWebAppHost {
  const host = webApp as TelegramLifecycleHost;
  const warm = () => {
    try {
      host.ready();
    } catch {
      // mock clients throw until Telegram attaches the bridge.
    }
    host.expand?.();
    clearHapticApiCache();
  };
  warm();
  host.onEvent?.("activated", warm);
  return webApp;
}

function launchDataAvailable(): boolean {
  const stored = readStoredTelegramInitParams();
  const hash = telegramInitParamsFromHash(window.location.hash);
  return Boolean(stored?.tgWebAppData || hash?.tgWebAppData);
}

async function waitForTelegramWebAppHost(): Promise<TelegramWebAppHost> {
  const started = Date.now();
  while (Date.now() - started < TELEGRAM_SDK_WAIT_MS) {
    ensureTelegramSdkPrimed();
    const webApp = (window as TelegramWindow).Telegram?.WebApp;
    if (webApp?.initData?.trim()) {
      return webApp;
    }
    if (webApp && launchDataAvailable() && recoverTelegramInitOnce()) {
      throw new Error("telegram init reload");
    }
    await sleep(40);
  }

  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  if (webApp) {
    if (!webApp.initData?.trim() && launchDataAvailable() && recoverTelegramInitOnce()) {
      throw new Error("telegram init reload");
    }
    return webApp;
  }

  await import("@twa-dev/sdk");
  return resolveTelegramWebAppHost();
}

export async function loadTelegramWebApp(): Promise<TelegramWebAppHost> {
  ensureTelegramSdkPrimed();
  if (!webAppLoad) {
    webAppLoad = waitForTelegramWebAppHost()
      .then((webApp) => primeTelegramWebAppHost(webApp))
      .catch((error) => {
        webAppLoad = undefined;
        if (error instanceof Error && error.message === "telegram init reload") {
          throw error;
        }
        const fallback = (window as TelegramWindow).Telegram?.WebApp;
        if (!fallback) {
          throw new Error("telegram webapp unavailable");
        }
        return primeTelegramWebAppHost(fallback);
      });
  }
  return webAppLoad;
}

export async function waitForTelegramInitData(
  timeoutMs = 1_800,
): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    ensureTelegramSdkPrimed();
    const webApp = await loadTelegramWebApp();
    const initData = webApp.initData?.trim() ?? "";
    if (initData) {
      clearTelegramInitReloadFlag();
      return initData;
    }
    const stored = readStoredTelegramInitParams();
    if (stored?.tgWebAppData && recoverTelegramInitOnce()) {
      return "";
    }
    await sleep(80);
  }
  return (await loadTelegramWebApp()).initData?.trim() ?? "";
}

export async function openTelegramShareUrl(
  url: string,
  text: string,
): Promise<boolean> {
  const webApp = await loadTelegramWebApp();
  if (!webApp.initData?.trim()) {
    return false;
  }
  const link = telegramShareUrl(url, text);
  if (typeof webApp.openTelegramLink !== "function") {
    return false;
  }
  try {
    webApp.openTelegramLink(link, { force_request: true });
    return true;
  } catch {
    try {
      webApp.openTelegramLink(link);
      return true;
    } catch {
      return false;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
