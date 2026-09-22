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
  const link = forOpenTelegramLink(url);
  if (!link) {
    return false;
  }

  const webApp = await loadTelegramWebApp();
  if (webApp?.initData && typeof webApp.openTelegramLink === "function") {
    try {
      webApp.openTelegramLink(link, { force_request: true });
      tryClose(webApp);
      return true;
    } catch {
      // Old clients reject options or the method itself.
    }

    try {
      webApp.openTelegramLink(link);
      tryClose(webApp);
      return true;
    } catch {
      // Fall through to a plain navigation.
    }
  }

  try {
    window.location.assign(link);
    tryClose(webApp);
    return true;
  } catch {
    return false;
  }
}

/** SDK openTelegramLink only accepts hostname `t.me`, not `www.t.me`. */
export function forOpenTelegramLink(url: string): string | null {
  if (!isTelegramMeUrl(url)) {
    return null;
  }

  try {
    const parsed = new URL(url);
    parsed.protocol = "https:";
    parsed.hostname = "t.me";
    return parsed.toString();
  } catch {
    return null;
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
