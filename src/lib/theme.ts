export const THEME_COOKIE = "yeah-buddy-theme";
export const LIGHT_THEME_COLOR = "#f6f1e8";
export const DARK_THEME_COLOR = "#2a241f";

export type Theme = "light" | "dark";

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

  void syncTelegramColors(theme);
}

async function syncTelegramColors(theme: Theme) {
  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default as {
      setHeaderColor?: (color: string) => void;
      setBackgroundColor?: (color: string) => void;
    };
    const color = theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
    webApp.setHeaderColor?.(color);
    webApp.setBackgroundColor?.(color);
  } catch {
    // Outside Telegram the SDK is optional.
  }
}
