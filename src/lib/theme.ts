export const THEME_COOKIE = "yeah-buddy-theme";
export const LIGHT_THEME_COLOR = "#f6f1e8";
export const DARK_THEME_COLOR = "#2a241f";

export type Theme = "light" | "dark";

type TelegramWebApp = {
  isVersionAtLeast?: (version: string) => boolean;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
};

const TELEGRAM_COLOR_API = "6.1";
const TELEGRAM_BOTTOM_BAR_API = "7.10";

let telegramWebApp: TelegramWebApp | null | undefined;
let telegramLoad: Promise<TelegramWebApp | null> | undefined;
let pendingTelegramTheme: Theme | null = null;

export function parseTheme(value: string | undefined | null): Theme {
  return value === "dark" ? "dark" : "light";
}

export function persistTheme(theme: Theme) {
  // Cookie Store API is not available in all Mini App webviews.
  // biome-ignore lint/suspicious/noDocumentCookie: SSR reads this cookie on the next request.
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
    );
  }

  syncTelegramColors(theme);
}

function getTelegramWebApp(): Promise<TelegramWebApp | null> {
  if (!telegramLoad) {
    telegramLoad = import("@twa-dev/sdk")
      .then((sdk) => {
        telegramWebApp = sdk.default as TelegramWebApp;
        return telegramWebApp;
      })
      .catch(() => {
        telegramWebApp = null;
        return null;
      });
  }
  return telegramLoad;
}

function paintTelegram(theme: Theme, webApp: TelegramWebApp) {
  // setHeaderColor / setBackgroundColor warn on Telegram WebApp 6.0.
  // In fullscreen (8.0+) header color still tints status-bar / dismiss-handle contrast.
  if (!webApp.isVersionAtLeast?.(TELEGRAM_COLOR_API)) {
    return;
  }

  const color = theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
  webApp.setHeaderColor?.(color);
  webApp.setBackgroundColor?.(color);
  if (webApp.isVersionAtLeast?.(TELEGRAM_BOTTOM_BAR_API)) {
    webApp.setBottomBarColor?.(color);
  }
}

function syncTelegramColors(theme: Theme) {
  pendingTelegramTheme = theme;

  if (telegramWebApp !== undefined) {
    if (telegramWebApp) {
      paintTelegram(theme, telegramWebApp);
    }
    return;
  }

  void getTelegramWebApp().then((webApp) => {
    if (webApp && pendingTelegramTheme) {
      paintTelegram(pendingTelegramTheme, webApp);
    }
  });
}
