import { ApiError, mutateJson, peekJson, writeJson } from "@/lib/api-cache";
import {
  daysUrl,
  readCachedDay,
  writeCachedDay,
  writeDayResponse,
} from "@/lib/day/cache";
import {
  dayCreateClientIds,
  isTempId,
  mergeCreatedDay,
  withReplacedItems,
  zipClientIds,
} from "@/lib/day/optimistic";
import { readDay } from "@/lib/day/today-payload";
import { readMealItemPayload, readMealItemsPayload } from "@/lib/meal/parse";
import {
  listOutbox,
  type OutboxOp,
  outboxReferencesId,
  replaceOutbox,
  rewriteOutboxClientId,
  rewriteOutboxClientIds,
} from "@/lib/outbox";
import { appendDeadOutbox } from "@/lib/outbox-dead";
import {
  classifyOutboxFlushError,
  MAX_OUTBOX_RETRY_ATTEMPTS,
  outboxBackoffMs,
  readFlushErrorMeta,
} from "@/lib/outbox-flush-policy";
import { reportOutboxSyncFailed } from "@/lib/outbox-sync-report";
import { isRecord } from "@/lib/read";
import type { MealItem } from "@/lib/types";
import { readTodaySession } from "@/lib/workout/hub-payload";
import { rewriteSessionDraftIds } from "@/lib/workout/session-draft-store";
import {
  sessionDateUrl,
  sessionDetailUrl,
  sessionIdMap,
  writeHubSession,
} from "@/lib/workout/session-local";
import { readSessionDetail } from "@/lib/workout/session-payload";

let flushPromise: Promise<void> | null = null;

interface RetryState {
  attempts: number;
  nextAt: number;
}

const retryByOpId = new Map<string, RetryState>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(delayMs: number): void {
  if (flushTimer != null) {
    return;
  }
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushOutbox();
  }, delayMs);
}

export async function flushOutbox(): Promise<void> {
  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = flushOnce().finally(() => {
    flushPromise = null;
  });
  return flushPromise;
}

async function flushOnce(): Promise<void> {
  let ops = listOutbox();
  while (ops.length > 0) {
    const op = ops[0];
    if (!op) {
      return;
    }

    const retry = retryByOpId.get(op.id);
    if (retry && Date.now() < retry.nextAt) {
      return;
    }

    try {
      const data = await sendOp(op);
      retryByOpId.delete(op.id);
      ops = applyFlushResult(ops.slice(1), op, data);
      replaceOutbox(ops);
    } catch (error) {
      const kind = classifyOutboxFlushError(error);
      if (kind === "auth") {
        return;
      }
      if (kind === "terminal") {
        const meta = readFlushErrorMeta(error);
        appendDeadOutbox(op, meta);
        reportOutboxSyncFailed(op, meta.status);
        retryByOpId.delete(op.id);
        ops = parkFailedSessionDependents(ops.slice(1), op);
        replaceOutbox(ops);
        continue;
      }

      const attempts = (retry?.attempts ?? 0) + 1;
      if (attempts >= MAX_OUTBOX_RETRY_ATTEMPTS) {
        const meta = readFlushErrorMeta(error);
        appendDeadOutbox(op, meta);
        reportOutboxSyncFailed(op, meta.status);
        retryByOpId.delete(op.id);
        ops = parkFailedSessionDependents(ops.slice(1), op);
        replaceOutbox(ops);
        continue;
      }

      const delayMs = outboxBackoffMs(attempts);
      retryByOpId.set(op.id, {
        attempts,
        nextAt: Date.now() + delayMs,
      });
      scheduleFlush(delayMs);
      return;
    }
  }
}

async function sendOp(op: OutboxOp): Promise<unknown> {
  try {
    const data = await mutateJson(op.url, {
      method: op.method,
      headers:
        op.body == null ? undefined : { "Content-Type": "application/json" },
      body: op.body == null ? undefined : JSON.stringify(op.body),
    });
    return hydrateFlushData(op, data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const recovered = await recoverConflict(op);
      if (recovered != null) {
        return recovered;
      }
    }
    throw error;
  }
}

async function hydrateFlushData(op: OutboxOp, data: unknown): Promise<unknown> {
  if (!isSessionCreate(op)) {
    return data;
  }
  const detail = readSessionDetail(data);
  if (detail) {
    return data;
  }
  const session = readTodaySession(data);
  if (!session) {
    return data;
  }
  return mutateJson(sessionDetailUrl(session.id));
}

async function recoverConflict(op: OutboxOp): Promise<unknown | null> {
  if (isDayCreate(op)) {
    const date = dateFromCreateDay(op);
    if (!date) {
      return null;
    }
    return mutateJson(daysUrl(date));
  }
  if (isSessionCreate(op)) {
    const date = dateFromCreateSession(op);
    if (!date) {
      return null;
    }
    const hub = await mutateJson(sessionDateUrl(date));
    const session = readTodaySession(hub);
    if (!session) {
      return null;
    }
    return mutateJson(sessionDetailUrl(session.id));
  }
  return null;
}

export function applyFlushResult(
  rest: OutboxOp[],
  op: OutboxOp,
  data: unknown,
): OutboxOp[] {
  if (isDayCreate(op)) {
    return applyDayCreate(rest, op, data);
  }
  if (isSessionCreate(op)) {
    return applySessionCreate(rest, op, data);
  }
  applyCache(op, data);
  return rewriteClientIds(rest, op, data);
}

function applyDayCreate(
  rest: OutboxOp[],
  op: OutboxOp,
  data: unknown,
): OutboxOp[] {
  const server = readDay(data);
  const date = dateFromCreateDay(op) ?? server?.date ?? null;
  const clientIds = op.clientIds ?? [];
  if (!server || !date) {
    return rest;
  }

  const idMap = zipClientIds(clientIds, dayCreateClientIds(server));
  const local = readCachedDay(date);
  writeDayResponse(date, data);
  if (local) {
    writeDayResponse(date, {
      day: mergeCreatedDay(local, server, new Set(clientIds)),
    });
  }

  return rewriteOutboxClientIds(rest, idMap);
}

function applySessionCreate(
  rest: OutboxOp[],
  op: OutboxOp,
  data: unknown,
): OutboxOp[] {
  const real = readSessionDetail(data);
  const clientId = op.clientIds?.[0];
  const local = clientId
    ? readSessionDetail(peekJson(sessionDetailUrl(clientId)))
    : null;

  if (real && local) {
    const ids = sessionIdMap(local, real);
    rewriteSessionDraftIds(local.session.id, real.session.id, ids);
    writeJson(sessionDetailUrl(real.session.id), real);
    if (clientId && clientId !== real.session.id) {
      writeJson(sessionDetailUrl(clientId), real);
    }
    writeHubSession(real.session.session_date, real.session, real.template);
    return rewriteOutboxClientIds(rest, ids);
  }

  if (real) {
    writeJson(sessionDetailUrl(real.session.id), real);
    writeHubSession(real.session.session_date, real.session, real.template);
    if (clientId && clientId !== real.session.id) {
      writeJson(sessionDetailUrl(clientId), real);
      return rewriteOutboxClientId(rest, clientId, real.session.id);
    }
    return rest;
  }

  const session = readTodaySession(data);
  if (!session) {
    return rest;
  }
  writeHubSession(session.session_date, session);
  if (clientId && clientId !== session.id) {
    return rewriteOutboxClientId(rest, clientId, session.id);
  }
  return rest;
}

function applyCache(op: OutboxOp, data: unknown): void {
  if (op.url.endsWith("/complete")) {
    const sessionUrl = op.url.replace(/\/complete$/, "");
    writeJson(sessionUrl, data);
    const detail = readSessionDetail(data);
    if (detail) {
      writeHubSession(detail.session.session_date, detail.session);
    }
    return;
  }

  const replacements = itemReplacements(op, data);
  if (replacements.size === 0) {
    return;
  }

  for (const cacheUrl of op.cacheUrls) {
    const date = dateFromDaysUrl(cacheUrl);
    if (!date) {
      continue;
    }
    const latest = readCachedDay(date);
    if (!latest) {
      continue;
    }
    writeCachedDay(date, withReplacedItems(latest, replacements));
  }
}

function rewriteClientIds(
  rest: OutboxOp[],
  op: OutboxOp,
  data: unknown,
): OutboxOp[] {
  const replacements = itemReplacements(op, data);
  let next = rest;
  for (const [clientId, item] of replacements) {
    next = rewriteOutboxClientId(next, clientId, item.id);
  }
  return next;
}

function itemReplacements(op: OutboxOp, data: unknown): Map<string, MealItem> {
  const clientIds = op.clientIds ?? [];
  const savedItems = readMealItemsPayload(data);
  const savedItem = readMealItemPayload(data);
  const items =
    savedItems.length > 0 ? savedItems : savedItem ? [savedItem] : [];
  const replacements = new Map<string, MealItem>();
  clientIds.forEach((clientId, index) => {
    const item = items[index];
    if (item) {
      replacements.set(clientId, item);
    }
  });
  return replacements;
}

function isDayCreate(op: OutboxOp): boolean {
  return op.method === "POST" && op.url === "/api/days";
}

function isSessionCreate(op: OutboxOp): boolean {
  return op.method === "POST" && op.url === "/api/sessions";
}

export function sessionCreateTempId(op: OutboxOp): string | null {
  if (!isSessionCreate(op)) {
    return null;
  }
  const clientId = op.clientIds?.[0];
  return clientId && isTempId(clientId) ? clientId : null;
}

export function splitSessionCreateDependents(
  rest: OutboxOp[],
  failed: OutboxOp,
): { keep: OutboxOp[]; drop: OutboxOp[] } {
  const tempIdValue = sessionCreateTempId(failed);
  if (!tempIdValue) {
    return { keep: rest, drop: [] };
  }
  const keep: OutboxOp[] = [];
  const drop: OutboxOp[] = [];
  for (const op of rest) {
    if (outboxReferencesId(op, tempIdValue)) {
      drop.push(op);
    } else {
      keep.push(op);
    }
  }
  return { keep, drop };
}

function parkFailedSessionDependents(
  rest: OutboxOp[],
  failed: OutboxOp,
): OutboxOp[] {
  const split = splitSessionCreateDependents(rest, failed);
  for (const op of split.drop) {
    appendDeadOutbox(op, {
      status: null,
      message: "Тренировка не создалась.",
    });
    reportOutboxSyncFailed(op, null);
    retryByOpId.delete(op.id);
  }
  return split.keep;
}

function dateFromCreateDay(op: OutboxOp): string | null {
  if (isRecord(op.body) && typeof op.body.date === "string") {
    return op.body.date;
  }
  const fromCache = op.cacheUrls
    .map(dateFromDaysUrl)
    .find((date): date is string => date != null);
  return fromCache ?? null;
}

function dateFromCreateSession(op: OutboxOp): string | null {
  if (isRecord(op.body) && typeof op.body.session_date === "string") {
    return op.body.session_date;
  }
  return null;
}

function dateFromDaysUrl(url: string): string | null {
  if (!url.startsWith("/api/days?")) {
    return null;
  }
  return new URL(url, "http://local").searchParams.get("date");
}
