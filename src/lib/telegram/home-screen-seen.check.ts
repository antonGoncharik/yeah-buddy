const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem(key: string) {
      return memory.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
    },
    removeItem(key: string) {
      memory.delete(key);
    },
  },
});

import {
  dismissHomeScreenTip,
  readHomeScreenTipDismissed,
} from "@/lib/telegram/home-screen-seen";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(!readHomeScreenTipDismissed(), "tip starts visible");
dismissHomeScreenTip();
assert(readHomeScreenTipDismissed(), "tip dismiss persists");
dismissHomeScreenTip();
assert(readHomeScreenTipDismissed(), "dismiss is idempotent");

console.log("home screen tip seen ok");
