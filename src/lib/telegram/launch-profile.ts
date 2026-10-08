import {
  isAndroidTelegram,
  isTelegramAppWebViewLaunch,
  readTelegramInitUnsafe,
  telegramPlatform,
} from "@/lib/telegram/launch-context";

export type TelegramLaunchKind = "bot-keyboard" | "app-webview";

/** Single policy object for gate, boot, haptics, and share. */
export type TelegramLaunchProfile = {
  kind: TelegramLaunchKind;
  platform: string;
  android: boolean;
  /** Request fullscreen via bindTelegramFullscreen (bot keyboard; iOS). */
  bindFullscreen: boolean;
  /** Android app-webview: only expand — native sheet is already fullscreen. */
  expandOnly: boolean;
  /** Android: map tap/tick to notification + navigator fallback. */
  androidNotificationHaptics: boolean;
  /** Prepared message + inline query (rich chat card); else URL / shareMessage. */
  shareUsesBotChatFlow: boolean;
};

export function resolveTelegramLaunchKind(): TelegramLaunchKind {
  return isTelegramAppWebViewLaunch() ? "app-webview" : "bot-keyboard";
}

export function getTelegramLaunchProfile(): TelegramLaunchProfile {
  const kind = resolveTelegramLaunchKind();
  const android = isAndroidTelegram();
  const appWebView = kind === "app-webview";

  return {
    kind,
    platform: telegramPlatform(),
    android,
    bindFullscreen: !android || !appWebView,
    expandOnly: android && appWebView,
    androidNotificationHaptics: android,
    shareUsesBotChatFlow: kind === "bot-keyboard",
  };
}

/** Debug string for settings / support (no PII). */
export function formatTelegramLaunchProfile(
  profile: TelegramLaunchProfile,
): string {
  const unsafe = readTelegramInitUnsafe();
  const flags: string[] = [profile.kind, profile.platform];
  if (unsafe.start_param) {
    flags.push("start");
  }
  if (unsafe.chat_type) {
    flags.push("chat");
  }
  if (profile.android) {
    flags.push("android-policy");
  }
  return flags.join(" · ");
}
