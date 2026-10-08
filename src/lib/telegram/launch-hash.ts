import { telegramInitParamsFromHash } from "@/lib/telegram/boot-script";

/** Keep Telegram launch params when the app rewrites the path via replaceState. */
export function appendPreservedTelegramLaunchHash(href: string): string {
  if (typeof window === "undefined") {
    return href;
  }
  const hash = window.location.hash;
  if (!hash.includes("tgWebApp") || href.includes("#")) {
    return href;
  }
  return `${href}${hash}`;
}

export function telegramLaunchParamsFromLocation(): Record<
  string,
  string
> | null {
  if (typeof window === "undefined") {
    return null;
  }
  const fromHash = telegramInitParamsFromHash(window.location.hash);
  if (fromHash) {
    return fromHash;
  }
  const search = window.location.search;
  if (!search.includes("tgWebApp")) {
    return null;
  }
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  )) {
    if (key.startsWith("tgWebApp")) {
      params[key] = value;
    }
  }
  if (!params.tgWebAppData && !params.tgWebAppVersion) {
    return null;
  }
  return params;
}
