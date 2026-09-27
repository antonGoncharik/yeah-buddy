import {
  coachStartPayload,
  parseCoachStartPayload,
  readCoachToken,
} from "@/lib/coach/start";
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
  parseCoachStartPayload(coachStartPayload(token)),
  token,
  "round trip",
);
assertEqual(parseCoachStartPayload(token), null, "raw token is not a start");
assertEqual(readCoachToken(token), token, "claim accepts raw token");
assertEqual(
  readCoachToken(coachStartPayload(token)),
  token,
  "claim accepts start payload",
);
assertEqual(readCoachToken("nope"), null, "junk token");
assertEqual(
  parseCoachStartPayload(`c_${"a".repeat(PACK_TOKEN_LENGTH - 2)}`),
  null,
  "short remainder is not a coach link",
);
assert(
  isPackToken(coachStartPayload(token)),
  "coach payload still matches the pack shape, so it must be classified first",
);

console.log("coach start ok");
