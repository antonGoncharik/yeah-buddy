import {
  enqueueOutbox,
  OUTBOX_KEY,
  type OutboxMethod,
  type OutboxOp,
} from "@/lib/outbox";
import { isRecord } from "@/lib/read";

export const OUTBOX_DEAD_KEY = "yb.v1:outbox:dead";

export interface DeadOutboxOp extends OutboxOp {
  failedAt: number;
  status: number | null;
  message: string;
}

type DeadListener = (ops: DeadOutboxOp[]) => void;

const deadListeners = new Set<DeadListener>();
let deadMemory: DeadOutboxOp[] | null = null;

export function subscribeDeadOutbox(listener: DeadListener): () => void {
  deadListeners.add(listener);
  return () => {
    deadListeners.delete(listener);
  };
}

export function listDeadOutbox(): DeadOutboxOp[] {
  return [...readDead()];
}

export function deadOutboxCount(): number {
  return readDead().length;
}

export function appendDeadOutbox(
  op: OutboxOp,
  failure: { status: number | null; message: string },
): void {
  const next: DeadOutboxOp = {
    ...op,
    failedAt: Date.now(),
    status: failure.status,
    message: failure.message,
  };
  writeDead([...readDead(), next]);
}

export function removeDeadOutbox(id: string): void {
  writeDead(readDead().filter((row) => row.id !== id));
}

export function clearDeadOutbox(): void {
  writeDead([]);
}

export function retryDeadOutbox(id: string): boolean {
  const dead = readDead();
  const index = dead.findIndex((row) => row.id === id);
  if (index < 0) {
    return false;
  }
  const row = dead[index];
  if (!row) {
    return false;
  }
  writeDead(dead.filter((item) => item.id !== id));
  enqueueOutbox(stripDeadFields(row));
  return true;
}

export function retryAllDeadOutbox(): number {
  const dead = readDead();
  if (dead.length === 0) {
    return 0;
  }
  writeDead([]);
  for (const row of dead) {
    enqueueOutbox(stripDeadFields(row));
  }
  return dead.length;
}

function stripDeadFields(row: DeadOutboxOp): Omit<OutboxOp, "id" | "at"> {
  return {
    method: row.method,
    url: row.url,
    body: row.body,
    cacheUrls: row.cacheUrls,
    clientIds: row.clientIds,
  };
}

function readDead(): DeadOutboxOp[] {
  const raw = storage()?.getItem(OUTBOX_DEAD_KEY) ?? null;
  if (raw == null || raw === "") {
    deadMemory = [];
    return deadMemory;
  }
  if (!deadMemory) {
    deadMemory = parseDead(raw);
  }
  return deadMemory;
}

function writeDead(ops: DeadOutboxOp[]): void {
  deadMemory = ops;
  const store = storage();
  if (store) {
    try {
      if (ops.length === 0) {
        store.removeItem(OUTBOX_DEAD_KEY);
      } else {
        store.setItem(OUTBOX_DEAD_KEY, JSON.stringify(ops));
      }
    } catch {
      // quota, private mode, or disabled storage
    }
  }
  for (const listener of deadListeners) {
    listener(ops);
  }
}

function parseDead(raw: string | null): DeadOutboxOp[] {
  if (raw == null || raw === "") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((row) => {
      const op = parseDeadOp(row);
      return op ? [op] : [];
    });
  } catch {
    return [];
  }
}

function parseDeadOp(value: unknown): DeadOutboxOp | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.at !== "number" ||
    typeof value.failedAt !== "number" ||
    typeof value.message !== "string"
  ) {
    return null;
  }
  const status =
    value.status === null || typeof value.status === "number"
      ? value.status
      : null;
  if (
    !isMethod(value.method) ||
    typeof value.url !== "string" ||
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
    failedAt: value.failedAt,
    status,
    message: value.message,
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

export const PROTECTED_STORAGE_KEYS = new Set([
  OUTBOX_KEY,
  OUTBOX_DEAD_KEY,
  "yb.v1:owner",
]);
