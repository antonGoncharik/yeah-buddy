import {
  TELEGRAM_BOOT_SCRIPT,
  TELEGRAM_INIT_STORAGE_KEY,
  telegramInitParamsFromHash,
} from "@/lib/telegram/boot-script";

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

console.log("telegram boot script ok");
