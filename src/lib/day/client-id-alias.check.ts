import {
  rememberClientIdAliases,
  resolveClientIdAlias,
} from "@/lib/day/client-id-alias";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: got ${String(actual)}, expected ${String(expected)}`);
  }
}

const store = new Map<string, string>();
const host = globalThis as typeof globalThis & {
  sessionStorage?: Storage;
};
host.sessionStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => store.clear(),
  key: () => null,
  length: 0,
};

rememberClientIdAliases(new Map([["temp:meal:abc", "real-meal"]]));
assertEqual(
  resolveClientIdAlias("temp:meal:abc"),
  "real-meal",
  "aliases survive a temp meal id",
);
assertEqual(
  resolveClientIdAlias("other"),
  "other",
  "unknown ids pass through",
);
