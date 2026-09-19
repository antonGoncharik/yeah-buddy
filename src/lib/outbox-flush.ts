import { reportActionError } from "@/lib/action-error";
import { ApiError, mutateJson, peekJson, writeJson } from "@/lib/api-cache";
import {
  daysUrl,
  readCachedDay,
  writeCachedDay,
  writeDayResponse,
} from "@/lib/day/cache";
import {
  dayCreateClientIds,
  mergeCreatedDay,
  withReplacedItems,
  zipClientIds,
} from "@/lib/day/optimistic";
import { readDay } from "@/lib/day/today-payload";
import { readMealItemPayload, readMealItemsPayload } from "@/lib/meal/parse";
import { LOAD_FAILED } from "@/lib/messages";
import { isNetworkError } from "@/lib/offline";
import {
  listOutbox,
  type OutboxOp,
  replaceOutbox,
  rewriteOutboxClientId,
  rewriteOutboxClientIds,
} from "@/lib/outbox";
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

let flushing = false;

export async function flushOutbox(): Promise<void> {
  if (flushing) {
    return;
  }

  flushing = true;
  try {
    await flushOnce();
  } finally {
    flushing = false;
  }
}

async function flushOnce(): Promise<void> {
  let ops = listOutbox();
  while (ops.length > 0) {
    const op = ops[0];
    if (!op) {
      return;
    }

    try {
      const data = await sendOp(op);
      ops = applyFlushResult(ops.slice(1), op, data);
      replaceOutbox(ops);
    } catch (error) {
      if (
        isNetworkError(error) ||
        (error instanceof ApiError && error.status === 401)
      ) {
        return;
      }
      reportActionError(error instanceof Error ? error.message : LOAD_FAILED);
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
