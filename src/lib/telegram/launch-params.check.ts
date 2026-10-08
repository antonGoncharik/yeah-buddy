import {
  scrubTelegramLaunchParams,
  storedLaunchParamsIndicateAppWebView,
} from "@/lib/telegram/launch-params";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  scrubTelegramLaunchParams({
    tgWebAppVersion: "8.0",
    tgWebAppData: "user%3D1&auth_date%3D1",
    tgWebAppStartParam: "open",
  }).tgWebAppStartParam,
  undefined,
  "scrub removes orphan start_param",
);

assertEqual(
  storedLaunchParamsIndicateAppWebView({
    tgWebAppPlatform: "android",
    tgWebAppData: "query_id%3D1",
  }),
  false,
  "bot keyboard stored params",
);

assertEqual(
  storedLaunchParamsIndicateAppWebView({
    tgWebAppPlatform: "android",
    tgWebAppData: "start_param%3Dopen%26user%3D1",
  }),
  true,
  "app webview stored params",
);

console.log("telegram launch params ok");
