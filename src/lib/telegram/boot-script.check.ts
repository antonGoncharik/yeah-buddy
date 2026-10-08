import { runInNewContext } from "node:vm";

import {
  TELEGRAM_BOOT_HIDE_CLASS,
  TELEGRAM_BOOT_SCRIPT,
  TELEGRAM_BOOT_STYLE,
  TELEGRAM_INIT_STORAGE_KEY,
  telegramInitParamsFromHash,
} from "@/lib/telegram/boot-script";
import { scrubTelegramLaunchParams } from "@/lib/telegram/launch-params";
import { TELEGRAM_FULLSCREEN_STORAGE_KEY } from "@/lib/telegram/fullscreen-storage";
import { DARK_THEME_COLOR, LIGHT_THEME_COLOR } from "@/lib/theme";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  telegramInitParamsFromHash(
    "#tgWebAppVersion=8.0&tgWebAppPlatform=ios&tgWebAppData=query_id%3D1",
  ),
  {
    tgWebAppVersion: "8.0",
    tgWebAppPlatform: "ios",
    tgWebAppData: "query_id=1",
  },
  "parses telegram launch hash",
);
assertEqual(
  telegramInitParamsFromHash("#home"),
  null,
  "ignores unrelated hashes",
);
assertEqual(
  scrubTelegramLaunchParams({
    tgWebAppVersion: "8.0",
    tgWebAppData: "user%3D1",
    tgWebAppStartParam: "open",
  }).tgWebAppStartParam,
  undefined,
  "scrub drops stale start_param",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("scrubLaunch"),
  true,
  "boot script scrubs merged launch params",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("skipAndroidEarlyFs"),
  true,
  "boot script skips early fullscreen only for app webview",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes(TELEGRAM_INIT_STORAGE_KEY),
  true,
  "boot script stores telegram init params",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("tgWebApp"),
  true,
  "boot script looks for telegram hash",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes('location.pathname==="/"'),
  true,
  "boot script leaves the public landing when Telegram opens /",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes('location.replace("/today"'),
  true,
  "boot script opens the diary from the public landing",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("web_app_request_fullscreen"),
  true,
  "boot script asks Telegram to hide the header",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes(
    `FS_KEY="${TELEGRAM_FULLSCREEN_STORAGE_KEY}"`,
  ) && TELEGRAM_BOOT_SCRIPT.includes("removeItem(FS_KEY)"),
  true,
  "boot script drops stale fullscreen cache before the SDK loads",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("hashchange"),
  true,
  "boot script keeps launch params when the hash arrives late",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("restoreHashFromStorage"),
  true,
  "boot script restores launch hash from session storage",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("hydrateLocal"),
  true,
  "boot script hydrates session storage from local storage",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("parseLaunchSearch"),
  true,
  "boot script reads tgWebApp params from the query string",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("scheduleTelegramSdk"),
  true,
  "boot script defers telegram-web-app.js until launch params exist",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.includes("maybeReloadStaleWebApp"),
  true,
  "boot script reloads when hash arrives after an empty WebApp boot",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.indexOf("restoreHashFromStorage") <
    TELEGRAM_BOOT_SCRIPT.indexOf("parseLaunchHash(location.hash)"),
  true,
  "boot script restores hash before parsing launch params",
);
assertEqual(
  TELEGRAM_BOOT_SCRIPT.indexOf(`classList.add("${TELEGRAM_BOOT_HIDE_CLASS}")`) <
    TELEGRAM_BOOT_SCRIPT.indexOf("location.replace"),
  true,
  "boot script hides the landing before redirecting",
);
assertEqual(
  TELEGRAM_BOOT_STYLE.includes(
    `html.${TELEGRAM_BOOT_HIDE_CLASS} body{visibility:hidden}`,
  ),
  true,
  "boot style hides the document",
);
assertEqual(
  TELEGRAM_BOOT_STYLE.includes(LIGHT_THEME_COLOR) &&
    TELEGRAM_BOOT_STYLE.includes(DARK_THEME_COLOR),
  true,
  "boot style keeps the theme background",
);

const launchHash =
  "#tgWebAppVersion=8.0&tgWebAppPlatform=ios&tgWebAppData=query_id%3D1";
const launchHashAndroidBot =
  "#tgWebAppVersion=8.0&tgWebAppPlatform=android&tgWebAppData=query_id%3D1";
const launchHashAndroidApp =
  "#tgWebAppVersion=8.0&tgWebAppPlatform=android&tgWebAppData=start_param%3Dopen%26user%3D1";

function runBoot(
  pathname: string,
  hash: string,
  options?: { userAgent?: string },
) {
  const storage = new Map<string, string>();
  const result: {
    classes: Set<string>;
    replaced: string | null;
    stored: string | null;
    fullscreen: number;
  } = {
    classes: new Set(),
    replaced: null,
    stored: null,
    fullscreen: 0,
  };
  runInNewContext(TELEGRAM_BOOT_SCRIPT, {
    navigator: { userAgent: options?.userAgent ?? "" },
    location: {
      hash,
      pathname,
      search: "",
      replace(url: string) {
        result.replaced = url;
      },
    },
    setTimeout() {
      return 0;
    },
    window: {
      TelegramWebviewProxy: {
        postEvent(event: string) {
          if (event === "web_app_request_fullscreen") {
            result.fullscreen += 1;
          }
        },
      },
    },
    sessionStorage: {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
        result.stored = value;
      },
      removeItem(key: string) {
        storage.delete(key);
      },
    },
    document: {
      documentElement: {
        classList: {
          add(name: string) {
            result.classes.add(name);
          },
          contains(name: string) {
            return result.classes.has(name);
          },
        },
      },
    },
    MutationObserver: class {
      observe() {}
    },
  });
  return result;
}

const opened = runBoot("/", launchHash);
assertEqual(opened.classes.has(TELEGRAM_BOOT_HIDE_CLASS), true, "launch hides");
assertEqual(opened.replaced, `/today${launchHash}`, "launch opens the diary");
assertEqual(
  opened.stored?.includes("tgWebAppData"),
  true,
  "launch stores init params",
);

const inside = runBoot("/today", launchHash);
assertEqual(
  inside.classes.has(TELEGRAM_BOOT_HIDE_CLASS),
  false,
  "diary stays visible",
);
assertEqual(inside.replaced, null, "diary is not redirected");
assertEqual(
  inside.fullscreen,
  1,
  "ios diary launch requests fullscreen before hydration",
);

const insideAndroidBot = runBoot("/today", launchHashAndroidBot);
assertEqual(
  insideAndroidBot.fullscreen,
  1,
  "android bot keyboard still requests early fullscreen",
);

const insideAndroidApp = runBoot("/today", launchHashAndroidApp);
assertEqual(
  insideAndroidApp.fullscreen,
  0,
  "android app webview skips early fullscreen",
);

const publicPage = runBoot("/", "#home");
assertEqual(
  publicPage.classes.has(TELEGRAM_BOOT_HIDE_CLASS),
  false,
  "public landing stays visible",
);
assertEqual(publicPage.replaced, null, "public landing is not redirected");
assertEqual(
  publicPage.fullscreen,
  0,
  "public landing does not request fullscreen",
);

console.log("telegram boot script ok");
