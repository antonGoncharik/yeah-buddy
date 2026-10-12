import { LOAD_FAILED, readApiError } from "@/lib/messages";
import { clearOutbox, hasPendingCache } from "@/lib/outbox";
import { clearDeadOutbox, PROTECTED_STORAGE_KEYS } from "@/lib/outbox-dead";
import { isRecord } from "@/lib/read";
import { clearSessionDrafts } from "@/lib/workout/session-draft-store";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const PREFIX = "yb.v1:";
const MAX_CHARS = 180_000;

interface CacheEntry {
  at: number;
  data: unknown;
}

const writeStamp = new Map<string, number>();
const inflight = new Map<string, number>();
let clock = 0;

export function beginMutation(url: string): void {
  inflight.set(url, (inflight.get(url) ?? 0) + 1);
}

export function endMutation(url: string): void {
  const next = (inflight.get(url) ?? 1) - 1;
  if (next <= 0) {
    inflight.delete(url);
  } else {
    inflight.set(url, next);
  }
}

export function peekJson(url: string): unknown | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(`${PREFIX}${url}`);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !("data" in parsed)) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

type CacheListener = (url: string, data: unknown) => void;

const cacheListeners = new Set<CacheListener>();

export function subscribeJson(listener: CacheListener): () => void {
  cacheListeners.add(listener);
  return () => {
    cacheListeners.delete(listener);
  };
}

export function forgetJson(url: string): void {
  writeStamp.delete(url);
  inflight.delete(url);
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(`${PREFIX}${url}`);
  } catch {
    // private mode, or disabled storage
  }
}

export function writeJson(url: string, data: unknown): void {
  writeStamp.set(url, ++clock);
  if (typeof localStorage !== "undefined") {
    const key = `${PREFIX}${url}`;
    const raw = JSON.stringify({ at: Date.now(), data } satisfies CacheEntry);
    if (raw.length <= MAX_CHARS) {
      persistCacheEntry(key, raw);
    }
  }
  for (const listener of cacheListeners) {
    listener(url, data);
  }
}

export function clearDiaryCache(): void {
  writeStamp.clear();
  inflight.clear();
  clearOutbox();
  clearDeadOutbox();
  clearSessionDrafts();
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(PREFIX)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  } catch {
    // private mode, or disabled storage
  }
}

export async function mutateJson(
  url: string,
  init: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      readApiError(data) ?? LOAD_FAILED,
      response.status,
      data,
    );
  }
  return data;
}

export async function postJson(url: string, body: unknown): Promise<unknown> {
  return mutateJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchJson(url: string, body: unknown): Promise<unknown> {
  return mutateJson(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function putJson(url: string, body: unknown): Promise<unknown> {
  return mutateJson(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteJson(url: string): Promise<unknown> {
  return mutateJson(url, { method: "DELETE" });
}

export async function fetchJson(url: string): Promise<unknown> {
  if (hasPendingCache(url)) {
    const cached = peekJson(url);
    if (cached != null) {
      return cached;
    }
  }

  const started = clock;
  const data = await mutateJson(url);
  if (
    (inflight.get(url) ?? 0) > 0 ||
    (writeStamp.get(url) ?? 0) >= started ||
    hasPendingCache(url)
  ) {
    return peekJson(url) ?? data;
  }
  writeJson(url, data);
  return data;
}

function persistCacheEntry(key: string, raw: string): void {
  try {
    localStorage.setItem(key, raw);
    return;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      return;
    }
  }

  while (evictOldestCacheEntry()) {
    try {
      localStorage.setItem(key, raw);
      return;
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        return;
      }
    }
  }
}

function isQuotaExceededError(error: unknown): boolean {
  if (!isRecord(error) && !(error instanceof DOMException)) {
    return false;
  }
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return true;
  }
  return (
    isRecord(error) &&
    (error.name === "QuotaExceededError" || error.code === 22)
  );
}

function evictOldestCacheEntry(): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }

  let oldestKey: string | null = null;
  let oldestAt = Number.POSITIVE_INFINITY;

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(PREFIX) || PROTECTED_STORAGE_KEYS.has(key)) {
        continue;
      }
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }
      let at = Number.POSITIVE_INFINITY;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isRecord(parsed) && typeof parsed.at === "number") {
          at = parsed.at;
        }
      } catch {
        at = 0;
      }
      if (at < oldestAt) {
        oldestAt = at;
        oldestKey = key;
      }
    }
    if (!oldestKey) {
      return false;
    }
    localStorage.removeItem(oldestKey);
    const url = oldestKey.slice(PREFIX.length);
    writeStamp.delete(url);
    return true;
  } catch {
    return false;
  }
}

export async function cachedGet(
  url: string,
  apply: (data: unknown) => boolean,
  onCached?: () => void,
): Promise<void> {
  const cached = peekJson(url);
  if (cached != null && apply(cached)) {
    onCached?.();
    if (hasPendingCache(url)) {
      return;
    }
  }

  try {
    const data = await fetchJson(url);
    if (!apply(data)) {
      throw new Error("load failed");
    }
  } catch (error) {
    if (cached != null) {
      return;
    }
    throw error;
  }
}
