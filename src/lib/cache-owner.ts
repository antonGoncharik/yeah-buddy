import { clearDiaryCache } from "@/lib/api-cache";
import { isRecord } from "@/lib/read";

const OWNER_KEY = "yb.v1:owner";

export function readCacheOwner(): string | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

function writeCacheOwner(userId: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    // private mode, or disabled storage
  }
}

/** Clears diary cache when the signed-in user changes; records the current owner. */
export function ensureCacheOwner(userId: string): void {
  const trimmed = userId.trim();
  if (!trimmed) {
    return;
  }
  const previous = readCacheOwner();
  if (previous === trimmed) {
    return;
  }
  clearDiaryCache();
  writeCacheOwner(trimmed);
}

export function readUserIdFromAuthBody(data: unknown): string | null {
  if (!isRecord(data)) {
    return null;
  }
  if (typeof data.userId === "string" && data.userId.trim()) {
    return data.userId.trim();
  }
  const user = data.user;
  if (isRecord(user) && typeof user.id === "string" && user.id.trim()) {
    return user.id.trim();
  }
  return null;
}
