export const TELEGRAM_FULLSCREEN_STORAGE_KEY = "__telegram__isFullscreen";

/** Telegram SDK caches fullscreen in sessionStorage; home-screen relaunches can lie. */
export function clearTelegramFullscreenCache(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(TELEGRAM_FULLSCREEN_STORAGE_KEY);
  } catch {
    // Private mode / disabled storage.
  }
}
