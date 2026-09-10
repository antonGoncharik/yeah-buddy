import { isPackToken } from "@/lib/share/token";

const PACK_PENDING_KEY = "yb.pack";
const PACK_SEEN_KEY = "yb.pack.seen";

export type PackBackFrom = "meals" | "schedule" | "packs";

function storage(): Storage | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  return sessionStorage;
}

export function rememberPackToken(token: string | null | undefined): void {
  if (!token || !isPackToken(token)) {
    return;
  }

  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(PACK_SEEN_KEY) === token) {
    return;
  }

  store.setItem(PACK_PENDING_KEY, token);
}

export function peekPendingPackToken(): string | null {
  return storage()?.getItem(PACK_PENDING_KEY) ?? null;
}

export function takePendingPackToken(): string | null {
  const store = storage();
  if (!store) {
    return null;
  }

  const token = store.getItem(PACK_PENDING_KEY);
  if (!token) {
    return null;
  }

  store.removeItem(PACK_PENDING_KEY);
  store.setItem(PACK_SEEN_KEY, token);
  return token;
}

export function dismissPendingPackToken(token: string): void {
  if (!isPackToken(token)) {
    return;
  }

  const store = storage();
  if (!store) {
    return;
  }

  if (store.getItem(PACK_PENDING_KEY) === token) {
    store.removeItem(PACK_PENDING_KEY);
  }
  store.setItem(PACK_SEEN_KEY, token);
}

export function packPath(token: string, from?: PackBackFrom): string {
  const path = `/packs/${token}`;
  if (!from) {
    return path;
  }
  return `${path}?from=${from}`;
}

export function parsePackBackFrom(value: string | null): PackBackFrom | null {
  if (value === "meals" || value === "schedule" || value === "packs") {
    return value;
  }
  return null;
}

export function packBackHref(from: PackBackFrom | null): string {
  if (from === "meals") {
    return "/settings/meals";
  }
  if (from === "schedule") {
    return "/workouts/schedule";
  }
  return "/settings/packs";
}
