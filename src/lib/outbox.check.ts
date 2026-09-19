import { isTempId, tempId } from "@/lib/day/optimistic";
import { isNetworkError } from "@/lib/offline";
import {
  applyEnqueue,
  type OutboxInput,
  type OutboxOp,
  rewriteOutboxClientId,
} from "@/lib/outbox";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

function op(input: OutboxInput, id: string, at: number): OutboxOp {
  return { ...input, id, at };
}

const addCottage: OutboxInput = {
  method: "POST",
  url: "/api/meals/m1/items",
  body: { foodId: "tvorog", grams: 200 },
  cacheUrls: ["/api/days?date=2026-09-19"],
  clientIds: ["temp:item:abc"],
};

const queued = applyEnqueue([], addCottage, 1);
assertEqual(queued.length, 1, "enqueue first write");
assertEqual(queued[0]?.body, addCottage.body, "keeps body");
assert(queued[0]?.clientIds?.[0] === "temp:item:abc", "keeps temp id");

const patched = applyEnqueue(
  queued,
  {
    method: "PATCH",
    url: "/api/meal-items/temp:item:abc",
    body: { grams: 180 },
    cacheUrls: ["/api/days?date=2026-09-19"],
    clientIds: ["temp:item:abc"],
  },
  2,
);
assertEqual(patched.length, 1, "grams patch merges into add");
assertEqual(patched[0]?.body, { foodId: "tvorog", grams: 180 }, "merged grams");

const deleted = applyEnqueue(
  patched,
  {
    method: "DELETE",
    url: "/api/meal-items/temp:item:abc",
    body: null,
    cacheUrls: ["/api/days?date=2026-09-19"],
    clientIds: ["temp:item:abc"],
  },
  3,
);
assertEqual(deleted.length, 0, "delete drops unsynced add");

const complete: OutboxInput = {
  method: "POST",
  url: "/api/sessions/s1/complete",
  body: { note: "heavy", feel: null, sets: [] },
  cacheUrls: ["/api/sessions/s1"],
};
const withComplete = applyEnqueue([], complete, 4);
const withFeel = applyEnqueue(
  withComplete,
  {
    method: "PATCH",
    url: "/api/sessions/s1",
    body: { feel: "easy" },
    cacheUrls: ["/api/sessions/s1"],
  },
  5,
);
assertEqual(withFeel.length, 1, "feel merges into complete");
assertEqual(
  withFeel[0]?.body,
  { note: "heavy", feel: "easy", sets: [] },
  "complete body has feel",
);

const replaced = applyEnqueue(
  withFeel,
  {
    ...complete,
    body: { note: "ok", feel: "close", sets: [{ id: "set-1" }] },
  },
  6,
);
assertEqual(replaced.length, 1, "second complete replaces");
assertEqual(
  replaced[0]?.body,
  {
    note: "ok",
    feel: "close",
    sets: [{ id: "set-1" }],
  },
  "latest complete wins",
);

const plate: OutboxInput = {
  method: "POST",
  url: "/api/meals/m1/plate",
  body: {
    items: [
      { kind: "food", foodId: "a", grams: 50 },
      { kind: "food", foodId: "b", grams: 70 },
    ],
  },
  cacheUrls: ["/api/days?date=2026-09-19"],
  clientIds: ["temp:item:a", "temp:item:b"],
};
const plated = applyEnqueue([], plate, 7);
const plateMinus = applyEnqueue(
  plated,
  {
    method: "DELETE",
    url: "/api/meal-items/temp:item:a",
    body: null,
    cacheUrls: ["/api/days?date=2026-09-19"],
    clientIds: ["temp:item:a"],
  },
  8,
);
assertEqual(plateMinus.length, 1, "plate stays");
assertEqual(plateMinus[0]?.clientIds, ["temp:item:b"], "removed one temp");
assertEqual(
  plateMinus[0]?.body,
  { items: [{ kind: "food", foodId: "b", grams: 70 }] },
  "plate body drops the row",
);

const rewritten = rewriteOutboxClientId(
  [
    op(
      {
        method: "PATCH",
        url: "/api/meal-items/temp:item:abc",
        body: { grams: 10 },
        cacheUrls: ["/api/days?date=2026-09-19"],
        clientIds: ["temp:item:abc"],
      },
      "op:1",
      9,
    ),
  ],
  "temp:item:abc",
  "real-id",
);
assertEqual(rewritten[0]?.url, "/api/meal-items/real-id", "rewrites url");
assertEqual(rewritten[0]?.clientIds, ["real-id"], "rewrites client id");

const shawarma: OutboxInput = {
  method: "POST",
  url: "/api/meals/m1/items",
  body: { name: "шаурма", protein: 30, fat: 20, carbs: 40 },
  cacheUrls: ["/api/days?date=2026-09-19"],
  clientIds: ["temp:item:lump"],
};
const twoAdds = applyEnqueue(queued, shawarma, 10);
assertEqual(twoAdds.length, 2, "second add stays");
assertEqual(twoAdds[1]?.body, shawarma.body, "keeps lump body");

const completeRewrite = rewriteOutboxClientId(
  [
    op(
      {
        method: "POST",
        url: "/api/sessions/temp:session:1/complete",
        body: {
          note: null,
          sets: [{ id: "temp:set:1", actual_weight: 80 }],
        },
        cacheUrls: ["/api/sessions/temp:session:1"],
        clientIds: ["temp:session:1"],
      },
      "op:2",
      11,
    ),
  ],
  "temp:session:1",
  "real-session",
);
assertEqual(
  completeRewrite[0]?.url,
  "/api/sessions/real-session/complete",
  "rewrites complete url",
);
assertEqual(
  completeRewrite[0]?.cacheUrls,
  ["/api/sessions/real-session"],
  "rewrites cache url",
);
const setRewrite = rewriteOutboxClientId(
  completeRewrite,
  "temp:set:1",
  "11111111-1111-1111-1111-111111111111",
);
assertEqual(
  setRewrite[0]?.body,
  {
    note: null,
    sets: [{ id: "11111111-1111-1111-1111-111111111111", actual_weight: 80 }],
  },
  "rewrites set id in body",
);

assert(isTempId(tempId("item")), "temp helper");
assert(
  isNetworkError(new TypeError("Failed to fetch")),
  "typeerror is network",
);
assert(
  !isNetworkError(Object.assign(new Error("bad"), { name: "ApiError" })),
  "api error is not network",
);

console.log("outbox ok");
