import {
  appendPreservedTelegramLaunchHash,
  telegramLaunchParamsFromLocation,
} from "@/lib/telegram/launch-hash";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const fakeWindow = {
  location: {
    pathname: "/today",
    search: "",
    hash: "#tgWebAppVersion=8.0&tgWebAppData=user%3D1",
  },
};

Object.defineProperty(globalThis, "window", {
  value: fakeWindow as Window,
  configurable: true,
});

assertEqual(
  appendPreservedTelegramLaunchHash("/today/2026-04-08"),
  "/today/2026-04-08#tgWebAppVersion=8.0&tgWebAppData=user%3D1",
  "preserve launch hash on replaceState",
);

fakeWindow.location.search =
  "?tgWebAppVersion=8.0&tgWebAppData=query_id%3D1&foo=bar";
fakeWindow.location.hash = "";
assertEqual(
  telegramLaunchParamsFromLocation()?.tgWebAppData,
  "query_id=1",
  "read launch params from search",
);

console.log("telegram launch hash ok");
