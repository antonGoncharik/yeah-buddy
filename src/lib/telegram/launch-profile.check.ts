import { getTelegramLaunchProfile } from "@/lib/telegram/launch-profile";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const fakeWindow: {
  location: { hash: string; search: string };
  Telegram?: {
    WebApp?: { initDataUnsafe?: Record<string, unknown> };
    WebView?: { initParams?: Record<string, string> };
  };
} = {
  location: { hash: "", search: "" },
  Telegram: {
    WebView: { initParams: { tgWebAppPlatform: "android" } },
    WebApp: { initDataUnsafe: {} },
  },
};

Object.defineProperty(globalThis, "window", {
  value: fakeWindow as unknown as Window,
  configurable: true,
});
Object.defineProperty(globalThis, "navigator", {
  value: { userAgent: "Telegram-Android" },
  configurable: true,
});

const botKeyboard = getTelegramLaunchProfile();
assertEqual(botKeyboard.kind, "bot-keyboard", "bot keyboard kind");
assertEqual(botKeyboard.bindFullscreen, true, "bot binds fullscreen on android");
assertEqual(botKeyboard.expandOnly, false, "bot is not expand-only");
assertEqual(botKeyboard.shareUsesBotChatFlow, true, "bot uses prepared share");

fakeWindow.Telegram!.WebApp!.initDataUnsafe = { start_param: "open" };
const appWebView = getTelegramLaunchProfile();
assertEqual(appWebView.kind, "app-webview", "start_param is app webview");
assertEqual(appWebView.expandOnly, true, "android app expand only");
assertEqual(appWebView.bindFullscreen, false, "android app skips bind");
assertEqual(appWebView.shareUsesBotChatFlow, false, "app uses fallback share");

console.log("telegram launch profile ok");
