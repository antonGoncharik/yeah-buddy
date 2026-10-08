import { TELEGRAM_INIT_STORAGE_KEY } from "@/lib/telegram/boot-script";
import {
  isTelegramAppWebViewLaunch,
  isTelegramKeyboardWebAppLaunch,
  readTelegramInitUnsafe,
} from "@/lib/telegram/launch-context";

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
    WebApp?: { initData?: string; initDataUnsafe?: Record<string, unknown> };
    WebView?: { initParams?: Record<string, string> };
  };
} = {
  location: { hash: "", search: "" },
  Telegram: {
    WebView: { initParams: { tgWebAppPlatform: "android" } },
    WebApp: {},
  },
};

Object.defineProperty(globalThis, "window", {
  value: fakeWindow as Window,
  configurable: true,
});

Object.defineProperty(globalThis, "navigator", {
  value: { userAgent: "Telegram-Android" },
  configurable: true,
});

fakeWindow.Telegram!.WebApp!.initDataUnsafe = {};
assertEqual(
  isTelegramKeyboardWebAppLaunch(),
  true,
  "plain bot keyboard web_app",
);

fakeWindow.Telegram!.WebView!.initParams!.tgWebAppStartParam = "open";
fakeWindow.Telegram!.WebApp!.initDataUnsafe = {
  start_param: "open",
};
assertEqual(
  isTelegramKeyboardWebAppLaunch(),
  false,
  "startapp open is app webview",
);
assertEqual(isTelegramAppWebViewLaunch(), true, "startapp is app webview");
delete fakeWindow.Telegram!.WebView!.initParams!.tgWebAppStartParam;

fakeWindow.Telegram!.WebApp!.initDataUnsafe = {
  chat_type: "sender",
};
assertEqual(
  isTelegramAppWebViewLaunch(),
  true,
  "direct link chat_type",
);

fakeWindow.Telegram!.WebApp!.initDataUnsafe = {};
fakeWindow.Telegram!.WebApp!.initData =
  "chat_instance=abc&user=%7B%22id%22%3A1%7D&auth_date=1&hash=x";
assertEqual(
  readTelegramInitUnsafe().chat_instance,
  "abc",
  "parse initData string",
);

const staleStore = new Map<string, string>();
staleStore.set(
  TELEGRAM_INIT_STORAGE_KEY,
  JSON.stringify({ tgWebAppStartParam: "open", tgWebAppVersion: "8.0" }),
);
fakeWindow.Telegram!.WebApp!.initDataUnsafe = {};
fakeWindow.Telegram!.WebApp!.initData = "";
fakeWindow.Telegram!.WebView!.initParams = { tgWebAppPlatform: "android" };
fakeWindow.location = { hash: "", search: "" };
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem(key: string) {
      return staleStore.get(key) ?? null;
    },
    setItem() {},
    removeItem() {},
  },
  configurable: true,
});
assertEqual(
  isTelegramKeyboardWebAppLaunch(),
  true,
  "stale stored start_param does not mark bot keyboard as app webview",
);

fakeWindow.location.hash =
  "#tgWebAppVersion=8.0&tgWebAppStartParam=open&tgWebAppData=user%3D1";
fakeWindow.Telegram!.WebView!.initParams = { tgWebAppPlatform: "android" };
assertEqual(
  isTelegramKeyboardWebAppLaunch(),
  true,
  "stale hash start_param without initData is still bot keyboard",
);

console.log("telegram launch context ok");
