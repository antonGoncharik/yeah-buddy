import { isTelegramMeUrl } from "@/lib/telegram/share-url";

type TelegramLinkWebApp = {
  initData?: string;
  openTelegramLink?: (
    url: string,
    options?: { force_request?: boolean },
  ) => void;
  close?: () => void;
};

/** Leave the Mini App for a t.me deep link so /start is delivered in the chat. */
export async function openTelegramChat(url: string): Promise<boolean> {
  if (!isTelegramMeUrl(url)) {
    return false;
  }

  const webApp = await loadTelegramWebApp();
  if (webApp?.initData && typeof webApp.openTelegramLink === "function") {
    try {
      webApp.openTelegramLink(url, { force_request: true });
      tryClose(webApp);
      return true;
    } catch {
      // Old clients reject options or the method itself.
    }

    try {
      webApp.openTelegramLink(url);
      tryClose(webApp);
      return true;
    } catch {
      // Fall through to a plain navigation.
    }
  }

  try {
    window.location.assign(url);
    tryClose(webApp);
    return true;
  } catch {
    return false;
  }
}

async function loadTelegramWebApp(): Promise<TelegramLinkWebApp | null> {
  try {
    const sdk = await import("@twa-dev/sdk");
    return sdk.default as TelegramLinkWebApp;
  } catch {
    return null;
  }
}

function tryClose(webApp: TelegramLinkWebApp | null): void {
  if (!webApp || typeof webApp.close !== "function") {
    return;
  }

  try {
    webApp.close();
  } catch {
    // Telegram 6.0 mock and old clients throw WebAppMethodUnsupported.
  }
}
