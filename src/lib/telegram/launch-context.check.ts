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
  Telegram?: {
    WebApp?: { initData?: string; initDataUnsafe?: Record<string, unknown> };
    WebView?: { initParams?: Record<string, string> };
  };
} = {
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

console.log("telegram launch context ok");
