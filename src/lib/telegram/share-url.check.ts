import { createPackToken } from "@/lib/share/token";
import {
  isTelegramMeUrl,
  resolveAppShareUrl,
  resolvePackShareUrl,
  withStartApp,
} from "@/lib/telegram/share-url";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assert(isTelegramMeUrl("https://t.me/yeahbuddy"), "t.me https");
assert(isTelegramMeUrl("https://www.t.me/yeahbuddy"), "www.t.me");
assert(!isTelegramMeUrl("http://t.me/yeahbuddy"), "t.me needs https");
assert(!isTelegramMeUrl("https://example.com"), "rejects app host");

assertEqual(
  resolveAppShareUrl({
    miniAppUrl: "https://t.me/yeahbuddy/app",
    botUsername: "other",
  }),
  "https://t.me/yeahbuddy/app",
  "direct mini app wins",
);

assertEqual(
  resolveAppShareUrl({
    miniAppUrl: "https://diary.example",
    botUsername: "yeahbuddybot",
  }),
  "https://t.me/yeahbuddybot",
  "bot username over https app",
);

assertEqual(
  resolveAppShareUrl({
    miniAppUrl: "https://diary.example",
    botUsername: null,
  }),
  "https://diary.example",
  "https app fallback",
);

assertEqual(
  resolveAppShareUrl({ miniAppUrl: null, botUsername: null }),
  null,
  "nothing to share",
);

const token = createPackToken();
assertEqual(
  resolvePackShareUrl(token, "https://t.me/yeahbuddybot"),
  `https://t.me/yeahbuddybot?startapp=${token}`,
  "pack startapp",
);
assertEqual(
  resolvePackShareUrl("nope", "https://t.me/yeahbuddybot"),
  null,
  "bad token",
);
assertEqual(
  withStartApp("https://t.me/yeahbuddy/app", token),
  `https://t.me/yeahbuddy/app?startapp=${token}`,
  "mini app startapp",
);

console.log("telegram share url ok");
