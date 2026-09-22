import { forOpenTelegramLink } from "@/lib/telegram/open-chat";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(
  forOpenTelegramLink("https://t.me/yeahbuddybot?start=w1"),
  "https://t.me/yeahbuddybot?start=w1",
  "keeps start",
);
assertEqual(
  forOpenTelegramLink("https://www.t.me/yeahbuddybot?start=w1"),
  "https://t.me/yeahbuddybot?start=w1",
  "strips www for the SDK",
);
assertEqual(
  forOpenTelegramLink("https://diary.example"),
  null,
  "rejects app host",
);

console.log("telegram open chat ok");
