import { ApiError } from "@/lib/api-cache";
import type { OutboxOp } from "@/lib/outbox";
import { splitSessionCreateDependents } from "@/lib/outbox-flush";
import {
  classifyOutboxFlushError,
  MAX_OUTBOX_RETRY_ATTEMPTS,
  outboxBackoffMs,
} from "@/lib/outbox-flush-policy";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

assert(
  classifyOutboxFlushError(new ApiError("bad", 400, null)) === "terminal",
  "400 terminal",
);
assert(
  classifyOutboxFlushError(new ApiError("missing", 404, null)) === "terminal",
  "404 terminal",
);
assert(
  classifyOutboxFlushError(new ApiError("auth", 401, null)) === "auth",
  "401 auth",
);
assert(
  classifyOutboxFlushError(new ApiError("busy", 429, null)) === "retryable",
  "429 retryable",
);
assert(
  classifyOutboxFlushError(new ApiError("down", 503, null)) === "retryable",
  "503 retryable",
);

assert(outboxBackoffMs(1) === 1_000, "backoff start");
assert(outboxBackoffMs(5) === 16_000, "backoff grows");
assert(outboxBackoffMs(20) === 30_000, "backoff cap");

const poison: OutboxOp = {
  id: "op:bad",
  at: 1,
  method: "POST",
  url: "/api/meals/bad/items",
  body: {},
  cacheUrls: [],
};
const healthy: OutboxOp = {
  id: "op:ok",
  at: 2,
  method: "PATCH",
  url: "/api/days/x",
  body: {},
  cacheUrls: [],
};

function simulateTerminalDrop(ops: OutboxOp[], op: OutboxOp): OutboxOp[] {
  if (classifyOutboxFlushError(new ApiError("bad", 400, null)) !== "terminal") {
    return ops;
  }
  const index = ops.findIndex((row) => row.id === op.id);
  if (index < 0) {
    return ops;
  }
  return ops.filter((row) => row.id !== op.id);
}

const queue = [poison, healthy];
const afterPoison = simulateTerminalDrop(queue, poison);
assert(
  afterPoison.length === 1 && afterPoison[0]?.id === healthy.id,
  "poison does not block tail",
);

assert(MAX_OUTBOX_RETRY_ATTEMPTS >= 5, "retry budget");

const failedSession: OutboxOp = {
  id: "create",
  at: 1,
  method: "POST",
  url: "/api/sessions",
  body: { session_date: "2026-10-12", template_id: "t" },
  cacheUrls: ["/api/sessions/temp:session:abc"],
  clientIds: ["temp:session:abc"],
};
const complete: OutboxOp = {
  id: "done",
  at: 2,
  method: "POST",
  url: "/api/sessions/temp:session:abc/complete",
  body: { sets: [{ id: "temp:set:1", actual_weight: 80 }] },
  cacheUrls: ["/api/sessions/temp:session:abc"],
  clientIds: ["temp:session:abc"],
};
const meal: OutboxOp = {
  id: "meal",
  at: 3,
  method: "POST",
  url: "/api/meals/m1/items",
  body: { name: "рис" },
  cacheUrls: ["/api/days?date=2026-10-12"],
};
const split = splitSessionCreateDependents([complete, meal], failedSession);
assert(
  split.drop.length === 1 && split.drop[0]?.id === "done",
  "dead session create drops its temp-id follow-ups",
);
assert(
  split.keep.length === 1 && split.keep[0]?.id === "meal",
  "unrelated ops stay queued",
);
const dayCreate: OutboxOp = {
  ...failedSession,
  url: "/api/days",
  clientIds: ["temp:day:1"],
};
const daySplit = splitSessionCreateDependents([complete], dayCreate);
assert(daySplit.drop.length === 0, "day create does not drop session ops");

console.log("outbox flush ok");
