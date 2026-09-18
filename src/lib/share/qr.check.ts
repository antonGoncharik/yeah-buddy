import { encodeShareQr } from "@/lib/share/qr";

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

const qr = encodeShareQr("https://t.me/yeahbuddybot");
if (!qr) {
  throw new Error("encodes invite url");
}
assert(qr.size >= 21, "qr has modules");
assert(qr.path.includes("M"), "qr has a path");
assert(qr.logo.size >= 5, "logo slot is visible");
assert(qr.logo.size / qr.size <= 0.24, "logo slot stays scannable");
assert(
  qr.logo.x >= 0 && qr.logo.x + qr.logo.size <= qr.size,
  "logo stays in bounds",
);
assert(
  qr.logo.x >= 4 + 7 && qr.logo.x + qr.logo.size <= qr.size - 4 - 7,
  "logo misses finders",
);

console.log("share qr ok");
