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
    if (!parsed || typeof parsed !== "object" || !("data" in parsed)) {
      return null;
    }

    return (parsed as CacheEntry).data;
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

export async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("load failed");
  }

  const data: unknown = await response.json();
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
