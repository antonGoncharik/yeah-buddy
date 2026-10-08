import { buddyStartPayload } from "@/lib/buddy/start";
import { coachStartPayload } from "@/lib/coach/start";
import { mealDraftStartPayload } from "@/lib/meal-chat/start";
import {
  dismissPendingBarbell,
  dismissPendingBuddyToken,
  dismissPendingCoachToken,
  dismissPendingMealDraftToken,
  dismissPendingPackToken,
  dismissPendingProgramId,
  packBackHref,
  packPath,
  parsePackBackFrom,
  peekPendingBarbell,
  peekPendingBuddyToken,
  peekPendingCoachToken,
  peekPendingMealDraftToken,
  peekPendingPackToken,
  peekPendingProgramId,
  rememberIncomingStart,
  rememberMealDraftToken,
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
rememberIncomingStart("barbell");
assert(peekPendingBarbell(), "barbell start queues game");
dismissPendingBarbell();
assert(!peekPendingBarbell(), "dismiss barbell");
rememberIncomingStart("barbell");
assert(!peekPendingBarbell(), "seen barbell is not queued again");

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

memory.clear();
const coachToken = createPackToken();
rememberIncomingStart(coachStartPayload(coachToken));
assert(peekPendingCoachToken() === coachToken, "start payload queues coach");
assert(peekPendingPackToken() === null, "coach start is not a pack");
assert(peekPendingProgramId() === null, "coach start is not a program");
dismissPendingCoachToken(coachToken);
assert(peekPendingCoachToken() === null, "dismiss coach");
rememberIncomingStart(coachStartPayload(coachToken));
assert(peekPendingCoachToken() === null, "seen coach is not queued again");

memory.clear();
const buddyToken = createPackToken();
rememberIncomingStart(buddyStartPayload(buddyToken));
assert(peekPendingBuddyToken() === buddyToken, "start payload queues buddy");
assert(peekPendingPackToken() === null, "buddy start is not a pack");
assert(peekPendingProgramId() === null, "buddy start is not a program");
assert(peekPendingCoachToken() === null, "buddy start is not coach");
dismissPendingBuddyToken(buddyToken);
assert(peekPendingBuddyToken() === null, "dismiss buddy");
rememberIncomingStart(buddyStartPayload(buddyToken));
assert(peekPendingBuddyToken() === null, "seen buddy is not queued again");

memory.clear();
const mealDraftToken = createPackToken();
rememberIncomingStart(mealDraftStartPayload(mealDraftToken));
assert(
  peekPendingMealDraftToken() === mealDraftToken,
  "meal draft start queues draft",
);
assert(peekPendingPackToken() === null, "meal draft is not a pack");
dismissPendingMealDraftToken(mealDraftToken);
assert(peekPendingMealDraftToken() === null, "dismiss meal draft");
rememberMealDraftToken(mealDraftToken);
assert(
  peekPendingMealDraftToken() === null,
  "seen meal draft is not queued again",
);

console.log("share pending ok");
