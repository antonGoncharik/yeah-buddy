import { LOAD_FAILED, readApiError } from "@/lib/messages";
import { isRecord } from "@/lib/read";

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

export function writeJson(url: string, data: unknown): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    const raw = JSON.stringify({ at: Date.now(), data } satisfies CacheEntry);
    if (raw.length > MAX_CHARS) {
      return;
    }
    localStorage.setItem(`${PREFIX}${url}`, raw);
  } catch {
    // quota, private mode, or disabled storage
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

export async function deleteJson(url: string): Promise<unknown> {
  return mutateJson(url, { method: "DELETE" });
}

export async function fetchJson(url: string): Promise<unknown> {
  const data = await mutateJson(url);
  writeJson(url, data);
  return data;
}

export async function cachedGet(
  url: string,
  apply: (data: unknown) => boolean,
  onCached?: () => void,
): Promise<void> {
  const cached = peekJson(url);
  if (cached != null && apply(cached)) {
    onCached?.();
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
