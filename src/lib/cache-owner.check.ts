import { peekJson, writeJson } from "@/lib/api-cache";
import {
  ensureCacheOwner,
  readCacheOwner,
  readUserIdFromAuthBody,
} from "@/lib/cache-owner";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

const storage = new Map<string, string>();

const localStorageMock = {
  get length() {
    return storage.size;
  },
  key(index: number): string | null {
    return [...storage.keys()][index] ?? null;
  },
  getItem(key: string): string | null {
    return storage.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    storage.set(key, value);
  },
  removeItem(key: string): void {
    storage.delete(key);
  },
  clear(): void {
    storage.clear();
  },
};

const previous = globalThis.localStorage;
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

try {
  storage.clear();
  ensureCacheOwner("user-a");
  writeJson("/api/days?date=2026-01-01", { day: 1 });
  assert(
    peekJson("/api/days?date=2026-01-01") != null,
    "cached day after first owner",
  );

  ensureCacheOwner("user-a");
  assert(
    peekJson("/api/days?date=2026-01-01") != null,
    "same owner keeps cache",
  );

  ensureCacheOwner("user-b");
  assert(
    peekJson("/api/days?date=2026-01-01") == null,
    "new owner clears cache",
  );
  assert(readCacheOwner() === "user-b", "owner updated");

  assert(
    readUserIdFromAuthBody({ ok: true, userId: "uuid-1" }) === "uuid-1",
    "parse userId field",
  );
  assert(
    readUserIdFromAuthBody({ user: { id: "uuid-2" } }) === "uuid-2",
    "parse nested user.id",
  );
} finally {
  if (previous !== undefined) {
    Object.defineProperty(globalThis, "localStorage", {
      value: previous,
      configurable: true,
    });
  } else {
    Reflect.deleteProperty(globalThis, "localStorage");
  }
  storage.clear();
}

console.log("cache owner ok");
