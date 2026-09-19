import { isTempId } from "@/lib/day/optimistic";
import { isRecord } from "@/lib/read";

export const OUTBOX_KEY = "yb.v1:outbox";

export type OutboxMethod = "POST" | "PATCH" | "PUT" | "DELETE";

export interface OutboxOp {
  id: string;
  at: number;
  method: OutboxMethod;
  url: string;
  body: unknown | null;
  cacheUrls: string[];
  clientIds?: string[];
}

export type OutboxInput = Omit<OutboxOp, "id" | "at">;

type Listener = (ops: OutboxOp[]) => void;

const listeners = new Set<Listener>();
let memory: OutboxOp[] | null = null;
let clock = 0;

export function subscribeOutbox(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function listOutbox(): OutboxOp[] {
  return [...readOps()];
}

export function outboxPending(): boolean {
  return readOps().length > 0;
}

export function hasPendingCache(url: string): boolean {
  return readOps().some((op) => op.cacheUrls.includes(url));
}

export function enqueueOutbox(input: OutboxInput): void {
  writeOps(applyEnqueue(readOps(), input, Date.now()));
}

export function replaceOutbox(ops: OutboxOp[]): void {
  writeOps(ops);
}

export function clearOutbox(): void {
  writeOps([]);
}

export function applyEnqueue(
  ops: OutboxOp[],
  next: OutboxInput,
  at: number,
): OutboxOp[] {
  const op: OutboxOp = { ...next, id: nextOpId(), at };
  const targetIds = next.clientIds ?? [];

  if (next.method === "DELETE" && targetIds.length > 0) {
    const remaining: OutboxOp[] = [];
    let changed = false;
    for (const current of ops) {
      const stripped = stripClientIds(current, targetIds);
      if (stripped === null) {
        changed = true;
        continue;
      }
      if (stripped !== current) {
        changed = true;
      }
      remaining.push(stripped);
    }
    if (changed || targetIds.every((id) => isTempId(id))) {
      return remaining;
    }
    remaining.push(op);
    return remaining;
  }

  if (next.method === "PATCH" && targetIds.length === 1) {
    const clientId = targetIds[0];
    const index = ops.findIndex(
      (current) =>
        current.method === "POST" &&
        current.clientIds?.length === 1 &&
        current.clientIds[0] === clientId,
    );
    if (index >= 0) {
      const copy = [...ops];
      const current = copy[index];
      if (current) {
        copy[index] = {
          ...current,
          body: mergeBodies(current.body, next.body),
          at,
        };
      }
      return copy;
    }
  }

  if (next.method === "PATCH") {
    const sessionId = sessionIdFromPatchUrl(next.url);
    if (sessionId) {
      const completeUrl = `/api/sessions/${sessionId}/complete`;
      const index = ops.findIndex(
        (current) => current.method === "POST" && current.url === completeUrl,
      );
      if (index >= 0) {
        const copy = [...ops];
        const current = copy[index];
        if (current) {
          copy[index] = {
            ...current,
            body: mergeBodies(current.body, next.body),
            at,
          };
        }
        return copy;
      }
    }
  }

  if (next.method === "POST" && targetIds.length > 0) {
    const index = ops.findIndex(
      (current) =>
        current.method === "POST" &&
        current.url === next.url &&
        sameClientIds(current.clientIds, targetIds),
    );
    if (index < 0) {
      return [...ops, op];
    }
    return replaceAt(ops, index, op, at);
  }

  const index = ops.findIndex(
    (current) => current.method === next.method && current.url === next.url,
  );
  if (index >= 0) {
    return replaceAt(ops, index, op, at);
  }

  return [...ops, op];
}

export function rewriteOutboxClientId(
  ops: OutboxOp[],
  from: string,
  to: string,
): OutboxOp[] {
  if (from === to) {
    return ops;
  }

  return ops.map((op) => ({
    ...op,
    url: op.url.includes(from) ? op.url.replaceAll(from, to) : op.url,
    cacheUrls: op.cacheUrls.map((url) =>
      url.includes(from) ? url.replaceAll(from, to) : url,
    ),
    clientIds: op.clientIds?.map((id) => (id === from ? to : id)),
    body: rewriteBodyIds(op.body, from, to),
  }));
}

export function rewriteOutboxClientIds(
  ops: OutboxOp[],
  ids: Map<string, string>,
): OutboxOp[] {
  let next = ops;
  for (const [from, to] of ids) {
    next = rewriteOutboxClientId(next, from, to);
  }
  return next;
}

function stripClientIds(op: OutboxOp, ids: string[]): OutboxOp | null {
  if (!op.clientIds?.some((id) => ids.includes(id))) {
    return op;
  }

  if (op.method !== "POST") {
    return op.clientIds.every((id) => ids.includes(id)) ? null : op;
  }

  const keep = op.clientIds
    .map((id, index) => ({ id, index }))
    .filter((row) => !ids.includes(row.id));
  if (keep.length === 0) {
    return null;
  }
  if (keep.length === op.clientIds.length) {
    return op;
  }

  const items =
    isRecord(op.body) && Array.isArray(op.body.items) ? op.body.items : null;
  return {
    ...op,
    clientIds: keep.map((row) => row.id),
    body:
      items && isRecord(op.body)
        ? { ...op.body, items: keep.map((row) => items[row.index]) }
        : op.body,
  };
}

function replaceAt(
  ops: OutboxOp[],
  index: number,
  next: OutboxOp,
  at: number,
): OutboxOp[] {
  const copy = [...ops];
  const current = copy[index];
  if (current) {
    copy[index] = {
      ...current,
      body: next.body,
      cacheUrls: next.cacheUrls,
      clientIds: next.clientIds ?? current.clientIds,
      at,
    };
  }
  return copy;
}

function sameClientIds(left: string[] | undefined, right: string[]): boolean {
  if (!left || left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}

function mergeBodies(base: unknown, patch: unknown): unknown {
  if (isRecord(base) && isRecord(patch)) {
    return { ...base, ...patch };
  }
  return patch ?? base;
}

function rewriteBodyIds(value: unknown, from: string, to: string): unknown {
  if (typeof value === "string") {
    return value === from ? to : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteBodyIds(item, from, to));
  }
  if (isRecord(value)) {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = rewriteBodyIds(item, from, to);
    }
    return next;
  }
  return value;
}

function sessionIdFromPatchUrl(url: string): string | null {
  const match = /^\/api\/sessions\/([^/]+)$/.exec(url);
  return match?.[1] ?? null;
}

function nextOpId(): string {
  clock += 1;
  return `op:${clock.toString(36)}`;
}

function readOps(): OutboxOp[] {
  if (memory) {
    return memory;
  }

  memory = parseOps(storage()?.getItem(OUTBOX_KEY) ?? null);
  return memory;
}

function writeOps(ops: OutboxOp[]): void {
  memory = ops;
  const store = storage();
  if (store) {
    try {
      if (ops.length === 0) {
        store.removeItem(OUTBOX_KEY);
      } else {
        store.setItem(OUTBOX_KEY, JSON.stringify(ops));
      }
    } catch {
      // quota, private mode, or disabled storage
    }
  }
  emit(ops);
}

function parseOps(raw: string | null): OutboxOp[] {
  if (raw == null || raw === "") {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((row) => {
      const op = parseOp(row);
      return op ? [op] : [];
    });
  } catch {
    return [];
  }
}

function parseOp(value: unknown): OutboxOp | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.at !== "number" ||
    !isMethod(value.method) ||
    typeof value.url !== "string" ||
    value.url.trim() === "" ||
    !Array.isArray(value.cacheUrls)
  ) {
    return null;
  }

  const cacheUrls = value.cacheUrls.filter(
    (item): item is string => typeof item === "string" && item !== "",
  );
  const clientIds = Array.isArray(value.clientIds)
    ? value.clientIds.filter(
        (item): item is string => typeof item === "string" && item !== "",
      )
    : undefined;

  return {
    id: value.id,
    at: value.at,
    method: value.method,
    url: value.url,
    body: "body" in value ? value.body : null,
    cacheUrls,
    clientIds: clientIds && clientIds.length > 0 ? clientIds : undefined,
  };
}

function isMethod(value: unknown): value is OutboxMethod {
  return (
    value === "POST" ||
    value === "PATCH" ||
    value === "PUT" ||
    value === "DELETE"
  );
}

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

function emit(ops: OutboxOp[]): void {
  for (const listener of listeners) {
    listener(ops);
  }
}
