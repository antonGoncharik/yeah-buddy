import {
  bindTelegramFullscreen,
  supportsTelegramFullscreen,
} from "@/lib/telegram/fullscreen";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  supportsTelegramFullscreen({
    isVersionAtLeast: () => false,
    requestFullscreen: () => {},
  }),
  false,
  "old clients stay on expand",
);
assertEqual(
  supportsTelegramFullscreen({ isVersionAtLeast: () => true }),
  false,
  "missing requestFullscreen is not a fullscreen client",
);

type Listener = (payload?: { error?: string }) => void;

function host(options: { version?: boolean; isFullscreen?: boolean } = {}) {
  const calls: string[] = [];
  const listeners: Record<string, Listener> = {};
  const queued: Array<() => void> = [];
  const state = {
    isFullscreen: options.isFullscreen ?? false,
  };
  const webApp = {
    isVersionAtLeast: () => options.version ?? true,
    get isFullscreen() {
      return state.isFullscreen;
    },
    requestFullscreen() {
      calls.push("request");
    },
    onEvent(event: string, callback: Listener) {
      listeners[event] = callback;
    },
    offEvent(event: string) {
      delete listeners[event];
    },
  };

  const unbind = bindTelegramFullscreen(webApp, (_ms, run) => {
    queued.push(run);
    return () => {
      const index = queued.indexOf(run);
      if (index >= 0) {
        queued.splice(index, 1);
      }
    };
  });

  return { calls, listeners, queued, state, unbind };
}

const stale = host({ isFullscreen: true });
assertEqual(
  stale.calls.length,
  1,
  "stale isFullscreen still requests fullscreen",
);
stale.queued[0]?.();
assertEqual(stale.calls.length, 2, "unconfirmed request is retried");
stale.listeners.fullscreenFailed?.({ error: "ALREADY_FULLSCREEN" });
stale.queued[1]?.();
assertEqual(stale.calls.length, 2, "already fullscreen ends the burst");

const opened = host();
opened.listeners.activated?.();
assertEqual(opened.calls.length, 2, "returning to the app requests fullscreen");
opened.state.isFullscreen = true;
opened.listeners.fullscreenChanged?.();
const beforeExit = opened.calls.length;
opened.state.isFullscreen = false;
opened.listeners.fullscreenChanged?.();
assertEqual(
  opened.calls.length,
  beforeExit,
  "leaving fullscreen does not immediately pull it back",
);

const desktop = host();
desktop.listeners.fullscreenFailed?.({ error: "UNSUPPORTED" });
desktop.listeners.activated?.();
assertEqual(desktop.calls.length, 1, "unsupported clients are not retried");

let thrownCalls = 0;
const queued: Array<() => void> = [];
bindTelegramFullscreen(
  {
    isVersionAtLeast: () => true,
    requestFullscreen() {
      thrownCalls += 1;
      throw new Error("WebAppMethodUnsupported");
    },
  },
  (_ms, run) => {
    queued.push(run);
    return () => {};
  },
);
queued[0]?.();
assertEqual(thrownCalls, 1, "a thrown request does not retry");

const legacy = host({ version: false });
assertEqual(legacy.calls.length, 0, "below 8.0 does not request fullscreen");
legacy.unbind();

console.log("telegram fullscreen ok");
