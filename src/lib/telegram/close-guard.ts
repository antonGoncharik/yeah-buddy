const VERTICAL_SWIPES_API = "7.7";

export type TelegramCloseGuardHost = {
  isVersionAtLeast?: (version: string) => boolean;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
};

function supportsApi(
  webApp: TelegramCloseGuardHost,
  version: string,
  method: keyof TelegramCloseGuardHost,
): boolean {
  if (typeof webApp[method] !== "function") {
    return false;
  }
  if (typeof webApp.isVersionAtLeast === "function") {
    return webApp.isVersionAtLeast(version);
  }
  return true;
}

/** Fewer accidental minimize/close gestures from the sheet body. */
export function applyTelegramCloseGuard(webApp: TelegramCloseGuardHost): void {
  if (
    supportsApi(webApp, VERTICAL_SWIPES_API, "disableVerticalSwipes")
  ) {
    try {
      webApp.disableVerticalSwipes?.();
    } catch {
      // Stale WebView mocks.
    }
  }
}

export function bindTelegramCloseGuard(
  webApp: TelegramCloseGuardHost,
): () => void {
  const hadVertical = supportsApi(
    webApp,
    VERTICAL_SWIPES_API,
    "disableVerticalSwipes",
  );
  applyTelegramCloseGuard(webApp);

  return () => {
    if (hadVertical) {
      try {
        webApp.enableVerticalSwipes?.();
      } catch {
        // ignore
      }
    }
  };
}
