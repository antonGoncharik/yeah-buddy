import {
  dismissPendingPackToken,
  dismissPendingProgramId,
  packBackHref,
  packPath,
  parsePackBackFrom,
  peekPendingPackToken,
  peekPendingProgramId,
  rememberIncomingStart,
  rememberPackToken,
  rememberProgramStart,
  takePendingPackToken,
} from "@/lib/share/pending";
import { programStartPayload } from "@/lib/share/program-start";
import { createPackToken } from "@/lib/share/token";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: {
    getItem(key: string) {
      return memory.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
    },
    removeItem(key: string) {
      memory.delete(key);
    },
  },
});

memory.clear();
const token = createPackToken();
rememberPackToken(token);
assert(peekPendingPackToken() === token, "remembers pending");

dismissPendingPackToken(token);
assert(peekPendingPackToken() === null, "dismiss clears pending");

rememberPackToken(token);
assert(peekPendingPackToken() === null, "seen token is not queued again");

memory.clear();
rememberPackToken(token);
assert(takePendingPackToken() === token, "take returns token");
assert(peekPendingPackToken() === null, "take clears pending");

assert(packPath(token) === `/packs/${token}`, "pack path");
assert(
  packPath(token, "meals") === `/packs/${token}?from=meals`,
  "pack path with from",
);
assert(parsePackBackFrom("schedule") === "schedule", "parse from");
assert(parsePackBackFrom("today") === "today", "parse today");
assert(parsePackBackFrom("nope") === null, "reject from");
assert(packBackHref("meals") === "/settings/meals", "back to meals");
assert(packBackHref("today") === "/today", "back to today");
assert(packBackHref(null) === "/settings/packs", "back default");

memory.clear();
rememberIncomingStart(programStartPayload("full_body"));
assert(peekPendingProgramId() === "full_body", "start payload queues program");
assert(peekPendingPackToken() === null, "program start is not a pack");

dismissPendingProgramId("full_body");
assert(peekPendingProgramId() === null, "dismiss program");
rememberProgramStart("full_body");
assert(peekPendingProgramId() === null, "seen program is not queued again");

memory.clear();
rememberIncomingStart("p_full_body");
assert(
  peekPendingProgramId() === "full_body",
  "p_full_body is a program first",
);
assert(
  peekPendingPackToken() === null,
  "pack parser does not steal p_full_body",
);

memory.clear();
rememberPackToken("p_full_body");
assert(
  peekPendingPackToken() === null,
  "remember pack rejects program payloads",
);

console.log("share pending ok");
