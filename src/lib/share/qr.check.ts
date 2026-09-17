import { encodeShareQr } from "@/lib/share/qr";
import { isPackToken } from "@/lib/share/token";
import { APP_INVITE_STARTAPP } from "@/lib/telegram/share-url";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(encodeShareQr(""), null, "blank url");
assertEqual(encodeShareQr("   "), null, "whitespace url");
assert(!isPackToken(APP_INVITE_STARTAPP), "invite startapp is not a pack");

const qr = encodeShareQr(
  `https://t.me/yeahbuddybot?startapp=${APP_INVITE_STARTAPP}`,
);
if (!qr) {
  throw new Error("encodes invite url");
}
assert(qr.size >= 21, "qr has modules");
assert(qr.modules.includes("M"), "qr has a path");
assert(qr.finders.length === 3, "qr has three finders");
assert(qr.logo.size >= 5, "logo hole is visible");
assert(
  qr.logo.x >= 0 && qr.logo.x + qr.logo.size <= qr.size,
  "logo stays in bounds",
);
assert(
  qr.finders.every((finder) => !rectsOverlap(qr.logo, finder, 7)),
  "logo misses finders",
);

console.log("share qr ok");

function rectsOverlap(
  logo: { x: number; y: number; size: number },
  finder: { x: number; y: number },
  finderSize: number,
): boolean {
  return !(
    logo.x + logo.size <= finder.x ||
    finder.x + finderSize <= logo.x ||
    logo.y + logo.size <= finder.y ||
    finder.y + finderSize <= logo.y
  );
}
