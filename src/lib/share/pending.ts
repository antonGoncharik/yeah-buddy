import { isPackToken } from "@/lib/share/token";

const PACK_PENDING_KEY = "yb.pack";
const PACK_SEEN_KEY = "yb.pack.seen";

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

export function packPath(token: string): string {
  return `/packs/${token}`;
}
