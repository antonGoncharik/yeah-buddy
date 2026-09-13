import {
  clipboardShareText,
  isShareAbort,
  shouldUseWebShare,
  webShareFields,
} from "@/lib/share/share-link";

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

assertEqual(
  clipboardShareText(
    "https://t.me/bot",
    "Дневник еды и тренировок — Yeah Buddy.",
  ),
  "Дневник еды и тренировок — Yeah Buddy.\nhttps://t.me/bot",
  "joins text and url",
);
assertEqual(
  clipboardShareText("https://t.me/bot", "  "),
  "https://t.me/bot",
  "blank text is url",
);
assertEqual(
  clipboardShareText("https://t.me/bot", "see https://t.me/bot"),
  "see https://t.me/bot",
  "does not duplicate url",
);

assertEqual(
  webShareFields({
    title: "Yeah Buddy",
    text: "Дневник",
    url: "https://t.me/bot",
  }),
  { title: "Yeah Buddy", text: "Дневник", url: "https://t.me/bot" },
  "web share fields",
);

assert(isShareAbort({ name: "AbortError" }), "abort by name");
assert(!isShareAbort({ name: "NotAllowedError" }), "not allowed is not abort");
assert(!isShareAbort("AbortError"), "string is not abort");

assert(
  shouldUseWebShare(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    true,
  ),
  "iphone uses web share",
);
assert(
  !shouldUseWebShare(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    false,
  ),
  "no share api",
);
assert(
  !shouldUseWebShare("Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0", true),
  "desktop copies instead",
);

console.log("share link ok");
