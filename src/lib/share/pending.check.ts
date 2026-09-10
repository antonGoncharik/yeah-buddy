import {
  dismissPendingPackToken,
  packBackHref,
  packPath,
  parsePackBackFrom,
  peekPendingPackToken,
  rememberPackToken,
  takePendingPackToken,
} from "@/lib/share/pending";
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
assert(parsePackBackFrom("nope") === null, "reject from");
assert(packBackHref("meals") === "/settings/meals", "back to meals");
assert(packBackHref(null) === "/settings/packs", "back default");

console.log("share pending ok");
