import { clearTelegramFullscreenCache } from "@/lib/telegram/fullscreen-storage";

const TELEGRAM_FULLSCREEN_API = "8.0";
export const FULLSCREEN_RETRY_MS = [0, 150, 600, 1200, 2500, 4000];
const ALREADY_FULLSCREEN_RESET_MS = [80, 350];
const MAX_ALREADY_FULLSCREEN_RESETS = 2;

type FullscreenListener = (payload?: { error?: string }) => void;

export type TelegramFullscreenHost = {
  isVersionAtLeast?: (version: string) => boolean;
  isFullscreen?: boolean;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  expand?: () => void;
  onEvent?: (event: string, callback: FullscreenListener) => void;
  offEvent?: (event: string, callback: FullscreenListener) => void;
};

export function supportsTelegramFullscreen(
  webApp: TelegramFullscreenHost,
): boolean {
  if (typeof webApp.requestFullscreen !== "function") {
    return false;
  }
  if (typeof webApp.isVersionAtLeast === "function") {
    return webApp.isVersionAtLeast(TELEGRAM_FULLSCREEN_API);
  }
  return true;
}

// Home-screen shortcuts open a new sheet with Telegram's header still up.
// The script also treats a stored isFullscreen flag as the live state, so one
// guarded requestFullscreen() never reaches that sheet.
export function bindTelegramFullscreen(
  webApp: TelegramFullscreenHost,
  schedule: (ms: number, fn: () => void) => number = (ms, fn) =>
    window.setTimeout(fn, ms),
  cancel: (id: number) => void = (id) => window.clearTimeout(id),
): () => void {
  if (!supportsTelegramFullscreen(webApp)) {
    webApp.expand?.();
    return () => {};
  }

  clearTelegramFullscreenCache();

  let settled = false;
  let alreadyFullscreenResets = 0;
  const recoveryTimers: number[] = [];
  const finish = () => {
    settled = true;
  };

  const request = () => {
    if (settled) {
      return;
    }
    try {
      webApp.expand?.();
      webApp.requestFullscreen?.();
    } catch {
      finish();
      webApp.expand?.();
    }
  };

  const onChanged = () => {
    if (webApp.isFullscreen) {
      finish();
    }
  };

  const recoverFromStaleFullscreen = () => {
    if (settled || alreadyFullscreenResets >= MAX_ALREADY_FULLSCREEN_RESETS) {
      finish();
      return;
    }
    alreadyFullscreenResets += 1;
    clearTelegramFullscreenCache();
    try {
      webApp.exitFullscreen?.();
    } catch {
      // Telegram 6.0 mock and old clients throw WebAppMethodUnsupported.
    }
    for (const ms of ALREADY_FULLSCREEN_RESET_MS) {
      recoveryTimers.push(schedule(ms, request));
    }
  };

  const onFailed = (payload?: { error?: string }) => {
    const error = payload?.error;
    if (error === "UNSUPPORTED") {
      finish();
      return;
    }
    if (error === "ALREADY_FULLSCREEN") {
      recoverFromStaleFullscreen();
    }
  };

  webApp.onEvent?.("fullscreenChanged", onChanged);
  webApp.onEvent?.("fullscreenFailed", onFailed);
  webApp.onEvent?.("activated", request);

  const timers = FULLSCREEN_RETRY_MS.map((ms) => schedule(ms, request));

  return () => {
    finish();
    for (const id of [...timers, ...recoveryTimers]) {
      cancel(id);
    }
    webApp.offEvent?.("fullscreenChanged", onChanged);
    webApp.offEvent?.("fullscreenFailed", onFailed);
    webApp.offEvent?.("activated", request);
  };
}
