import { APP_NAME } from "@/lib/brand";
import {
  clipboardShareText,
  isShareAbort,
  shouldUseWebShare,
  webShareFields,
} from "@/lib/share/share-link";

export async function shareOrCopyLink(
  url: string,
  text: string,
  title = APP_NAME,
): Promise<"shared" | "copied" | "cancelled"> {
  if (
    shouldUseWebShare(
      navigator.userAgent,
      typeof navigator.share === "function",
    )
  ) {
    const shared = await tryWebShare(webShareFields({ title, text, url }));
    if (shared) {
      return shared;
    }

    const fallback = await tryWebShare({
      title,
      text: clipboardShareText(url, text),
    });
    if (fallback) {
      return fallback;
    }
  }

  try {
    const sdk = await import("@twa-dev/sdk");
    const webApp = sdk.default as {
      initData?: string;
      openTelegramLink?: (link: string) => void;
    };
    if (webApp.initData && typeof webApp.openTelegramLink === "function") {
      const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      webApp.openTelegramLink(share);
      return "shared";
    }
  } catch {
    // outside Telegram, or old client
  }

  await copyText(clipboardShareText(url, text));
  return "copied";
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    // some WebViews deny Clipboard API even on a tap
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.append(field);
  field.select();
  const ok = document.execCommand("copy");
  field.remove();
  if (!ok) {
    throw new Error("copy failed");
  }
}

async function tryWebShare(
  data: ShareData,
): Promise<"shared" | "cancelled" | null> {
  try {
    if (typeof navigator.canShare === "function" && !navigator.canShare(data)) {
      return null;
    }
    await navigator.share(data);
    return "shared";
  } catch (error) {
    if (isShareAbort(error)) {
      return "cancelled";
    }
    return null;
  }
}
