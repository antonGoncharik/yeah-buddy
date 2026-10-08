import {
  telegramLaunchHashFromParams,
} from "@/lib/telegram/boot-script";
import {
  persistTelegramLaunchParams,
  restoreTelegramLaunchHashFromStorage,
  TELEGRAM_INIT_PARAMS_STORAGE_KEY,
  telegramInlineShareAvailable,
  telegramShareUrl,
} from "@/lib/telegram/webapp";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  telegramShareUrl("https://img.example/a.png", "Неделя"),
  "https://t.me/share/url?url=https%3A%2F%2Fimg.example%2Fa.png&text=%D0%9D%D0%B5%D0%B4%D0%B5%D0%BB%D1%8F",
  "share url",
);

const store = new Map<string, string>();
type FakeWindow = {
  sessionStorage: Storage;
  Telegram?: { WebView?: { initParams?: Record<string, string> } };
};

const fakeWindow: FakeWindow = {
  sessionStorage: {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    length: 0,
    clear() {
      store.clear();
    },
    key() {
      return null;
    },
  },
  Telegram: {
    WebView: {
      initParams: { tgWebAppBotInline: "1" },
    },
  },
};

Object.defineProperty(globalThis, "window", {
  value: fakeWindow as Window,
  configurable: true,
});

assertEqual(
  persistTelegramLaunchParams({
    tgWebAppVersion: "8.0",
    tgWebAppData: "user%3D1",
  })?.tgWebAppVersion,
  "8.0",
  "persist launch",
);

store.clear();
persistTelegramLaunchParams({
  tgWebAppVersion: "8.0",
  tgWebAppData: "user%3D1",
});
assertEqual(
  persistTelegramLaunchParams({ tgWebAppPlatform: "ios" })?.tgWebAppData,
  "user%3D1",
  "merge launch params",
);
assertEqual(
  store.get(TELEGRAM_INIT_PARAMS_STORAGE_KEY)?.includes("ios"),
  true,
  "merged platform is stored",
);

assertEqual(telegramInlineShareAvailable(), true, "inline flag");

fakeWindow.Telegram = { WebView: { initParams: {} } };
assertEqual(telegramInlineShareAvailable(), false, "inline off");

assertEqual(
  telegramLaunchHashFromParams({
    tgWebAppVersion: "8.0",
    tgWebAppData: "user%3D1",
  }),
  "#tgWebAppVersion=8.0&tgWebAppData=user%253D1",
  "launch hash from params",
);

const location = {
  pathname: "/today",
  search: "",
  hash: "",
  replaceState(_state: unknown, _title: string, url: string) {
    const hashIndex = url.indexOf("#");
    location.hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  },
};
Object.defineProperty(fakeWindow, "location", {
  value: location,
  configurable: true,
});
Object.defineProperty(fakeWindow, "history", {
  value: { state: null, replaceState: location.replaceState },
  configurable: true,
});

store.set(
  TELEGRAM_INIT_PARAMS_STORAGE_KEY,
  JSON.stringify({
    tgWebAppVersion: "8.0",
    tgWebAppData: "user%3D1",
  }),
);
assertEqual(restoreTelegramLaunchHashFromStorage(), true, "restore launch hash");
assertEqual(
  location.hash.includes("tgWebAppData"),
  true,
  "restored hash contains init data",
);

console.log("telegram webapp ok");
