import { createPackToken, isPackToken } from "@/lib/share/token";
import {
  isTelegramMeUrl,
  resolveAppShareUrl,
  resolvePackShareUrl,
  telegramBotChatUrl,
  withStart,
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
  telegramBotChatUrl("https://t.me/yeahbuddy/app?startapp=open"),
  "https://t.me/yeahbuddy",
  "strips mini app path",
);
assertEqual(
  telegramBotChatUrl("https://www.t.me/yeahbuddybot"),
  "https://t.me/yeahbuddybot",
  "normalizes www.t.me",
);
assertEqual(
  telegramBotChatUrl("https://diary.example"),
  null,
  "https app is not a bot chat",
);

assertEqual(
  resolveAppShareUrl({
    miniAppUrl: "https://t.me/yeahbuddy/app",
    botUsername: "yeahbuddybot",
  }),
  "https://t.me/yeahbuddybot",
  "bot username wins over mini app path",
);

assertEqual(
  resolveAppShareUrl({
    miniAppUrl: "https://t.me/yeahbuddybot?startapp=open",
    botUsername: "other",
  }),
  "https://t.me/other",
  "bot username wins over startapp",
);

assertEqual(
  resolveAppShareUrl({
    miniAppUrl: "https://t.me/yeahbuddy/app",
    botUsername: null,
  }),
  "https://t.me/yeahbuddy",
  "mini app path falls back to bot chat",
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
assert(isPackToken(token), "pack token");
assertEqual(
  resolvePackShareUrl(token, "https://t.me/yeahbuddybot"),
  `https://t.me/yeahbuddybot?start=${token}`,
  "pack opens bot with start",
);
assertEqual(
  resolvePackShareUrl(token, "https://t.me/yeahbuddy/app?startapp=open"),
  `https://t.me/yeahbuddy?start=${token}`,
  "pack strips mini app and startapp",
);
assertEqual(
  resolvePackShareUrl("nope", "https://t.me/yeahbuddybot"),
  null,
  "bad token",
);
assertEqual(
  resolvePackShareUrl(token, "https://diary.example"),
  withStartApp("https://diary.example", token),
  "https pack keeps startapp",
);
assertEqual(
  withStart("https://t.me/yeahbuddybot", token),
  `https://t.me/yeahbuddybot?start=${token}`,
  "start payload",
);
assertEqual(
  withStartApp("https://t.me/yeahbuddy/app", token),
  `https://t.me/yeahbuddy/app?startapp=${token}`,
  "mini app startapp",
);

console.log("telegram share url ok");
