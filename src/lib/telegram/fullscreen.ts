const TELEGRAM_FULLSCREEN_API = "8.0";
const FULLSCREEN_RETRY_MS = [150, 500];

type FullscreenListener = (payload?: { error?: string }) => void;

export type TelegramFullscreenHost = {
  isVersionAtLeast?: (version: string) => boolean;
  isFullscreen?: boolean;
  requestFullscreen?: () => void;
  onEvent?: (event: string, callback: FullscreenListener) => void;
  offEvent?: (event: string, callback: FullscreenListener) => void;
};

export function supportsTelegramFullscreen(
  webApp: TelegramFullscreenHost,
): boolean {
  return (
    typeof webApp.requestFullscreen === "function" &&
    webApp.isVersionAtLeast?.(TELEGRAM_FULLSCREEN_API) === true
  );
}

function defaultSchedule(ms: number, run: () => void): () => void {
  const id = window.setTimeout(run, ms);
  return () => window.clearTimeout(id);
}

// telegram-web-app.js restores `__telegram__isFullscreen` from the previous
// visit and treats that as the live mode. A reused WebView then opens with the
// Telegram header while `isFullscreen` is already true, so the request is skipped.
export function bindTelegramFullscreen(
  webApp: TelegramFullscreenHost,
  schedule: (ms: number, run: () => void) => () => void = defaultSchedule,
): () => void {
  if (!supportsTelegramFullscreen(webApp)) {
    return () => {};
  }

  let unsupported = false;
  let pending = false;
  const cancelTimers: Array<() => void> = [];

  const clearTimers = () => {
    for (const cancel of cancelTimers) {
      cancel();
    }
    cancelTimers.length = 0;
  };

  const request = () => {
    if (unsupported || !pending) {
      return;
    }
    try {
      webApp.requestFullscreen?.();
    } catch {
      unsupported = true;
      pending = false;
    }
  };

  const arm = () => {
    if (unsupported) {
      return;
    }
    clearTimers();
    pending = true;
    request();
    for (const ms of FULLSCREEN_RETRY_MS) {
      cancelTimers.push(
        schedule(ms, () => {
          request();
        }),
      );
    }
  };

  const onChanged = () => {
    if (webApp.isFullscreen) {
      pending = false;
    }
  };

  const onFailed: FullscreenListener = (payload) => {
    const error = payload?.error;
    if (error === "UNSUPPORTED") {
      unsupported = true;
      pending = false;
      return;
    }
    if (error === "ALREADY_FULLSCREEN") {
      pending = false;
    }
  };

  webApp.onEvent?.("fullscreenChanged", onChanged);
  webApp.onEvent?.("fullscreenFailed", onFailed);
  webApp.onEvent?.("activated", arm);

  arm();

  return () => {
    unsupported = true;
    pending = false;
    clearTimers();
    webApp.offEvent?.("fullscreenChanged", onChanged);
    webApp.offEvent?.("fullscreenFailed", onFailed);
    webApp.offEvent?.("activated", arm);
  };
}
