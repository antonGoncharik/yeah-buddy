import { reportActionError } from "@/lib/action-error";
import { ApiError, mutateJson, peekJson, writeJson } from "@/lib/api-cache";
import { readCachedDay, writeCachedDay } from "@/lib/day/cache";
import { withReplacedItems } from "@/lib/day/optimistic";
import { readMealItemPayload, readMealItemsPayload } from "@/lib/meal/parse";
import { LOAD_FAILED } from "@/lib/messages";
import { isNetworkError } from "@/lib/offline";
import {
  listOutbox,
  type OutboxOp,
  replaceOutbox,
  rewriteOutboxClientId,
} from "@/lib/outbox";
import { isRecord } from "@/lib/read";
import type { MealItem, WorkoutSession } from "@/lib/types";
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
      const data = await mutateJson(op.url, {
        method: op.method,
        headers:
          op.body == null ? undefined : { "Content-Type": "application/json" },
        body: op.body == null ? undefined : JSON.stringify(op.body),
      });
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

export function applyFlushResult(
  rest: OutboxOp[],
  op: OutboxOp,
  data: unknown,
): OutboxOp[] {
  applyCache(op, data);
  return rewriteClientIds(rest, op, data);
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

function writeHubSession(date: string, session: WorkoutSession): void {
  const url = `/api/sessions?date=${encodeURIComponent(date)}`;
  const current = peekJson(url);
  writeJson(url, isRecord(current) ? { ...current, session } : { session });
}

function dateFromDaysUrl(url: string): string | null {
  if (!url.startsWith("/api/days?")) {
    return null;
  }
  return new URL(url, "http://local").searchParams.get("date");
}
