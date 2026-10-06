import {
  buddyStartPayload,
  parseBuddyStartPayload,
  readBuddyToken,
} from "@/lib/buddy/start";
import {
  createPackToken,
  isPackToken,
  PACK_TOKEN_LENGTH,
} from "@/lib/share/token";

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

const token = createPackToken();
assertEqual(token.length, PACK_TOKEN_LENGTH, "pack length");
assertEqual(
  parseBuddyStartPayload(buddyStartPayload(token)),
  token,
  "round trip",
);
assertEqual(parseBuddyStartPayload(token), null, "raw token is not a start");
assertEqual(readBuddyToken(token), token, "claim accepts raw token");
assertEqual(
  readBuddyToken(buddyStartPayload(token)),
  token,
  "claim accepts start payload",
);
assertEqual(readBuddyToken("nope"), null, "junk token");
assertEqual(
  parseBuddyStartPayload(`b_${"a".repeat(PACK_TOKEN_LENGTH - 2)}`),
  null,
  "short remainder is not a buddy link",
);
assert(
  isPackToken(buddyStartPayload(token)),
  "buddy payload still matches the pack shape, so it must be classified first",
);

console.log("buddy start ok");
