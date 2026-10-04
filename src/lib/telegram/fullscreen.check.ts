import {
  bindTelegramFullscreen,
  FULLSCREEN_RETRY_MS,
  supportsTelegramFullscreen,
  type TelegramFullscreenHost,
} from "@/lib/telegram/fullscreen";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  !supportsTelegramFullscreen({}),
  "missing requestFullscreen is not fullscreen-capable",
);
assert(
  !supportsTelegramFullscreen({
    requestFullscreen() {},
    isVersionAtLeast: () => false,
  }),
  "old clients stay on expand",
);
assert(
  supportsTelegramFullscreen({
    requestFullscreen() {},
    isVersionAtLeast: (version) => version === "8.0",
  }),
  "8.0 can request fullscreen",
);

function bindHost(host: TelegramFullscreenHost, timers: Array<() => void>) {
  return bindTelegramFullscreen(
    host,
    (_ms, fn) => {
      timers.push(fn);
      return timers.length;
    },
    () => {},
  );
}

{
  const calls: string[] = [];
  const timers: Array<() => void> = [];
  bindHost(
    {
      expand() {
        calls.push("expand");
      },
    },
    timers,
  );
  assert(calls.join() === "expand", "old client only expands");
  assert(timers.length === 0, "old client does not retry fullscreen");
}

{
  const calls: string[] = [];
  const timers: Array<() => void> = [];
  const listeners = new Map<
    string,
    Array<(payload?: { error?: string }) => void>
  >();
  const host: TelegramFullscreenHost = {
    isFullscreen: true,
    isVersionAtLeast: () => true,
    requestFullscreen() {
      calls.push("request");
    },
    onEvent(event, callback) {
      const list = listeners.get(event) ?? [];
      list.push(callback);
      listeners.set(event, list);
    },
    offEvent() {},
  };
  bindHost(host, timers);
  assert(
    timers.length === FULLSCREEN_RETRY_MS.length,
    "fullscreen retries are scheduled",
  );
  timers[0]?.();
  assert(
    calls.join() === "request",
    "stored isFullscreen still requests fullscreen",
  );
  for (const listener of listeners.get("fullscreenChanged") ?? []) {
    listener();
  }
  timers[1]?.();
  assert(calls.length === 1, "confirmed fullscreen stops retries");
}

{
  const calls: string[] = [];
  const timers: Array<() => void> = [];
  const listeners = new Map<
    string,
    Array<(payload?: { error?: string }) => void>
  >();
  const host: TelegramFullscreenHost = {
    isFullscreen: false,
    isVersionAtLeast: () => true,
    requestFullscreen() {
      calls.push("request");
    },
    exitFullscreen() {
      calls.push("exit");
    },
    onEvent(event, callback) {
      const list = listeners.get(event) ?? [];
      list.push(callback);
      listeners.set(event, list);
    },
    offEvent() {},
  };
  bindHost(host, timers);
  timers[0]?.();
  for (const listener of listeners.get("fullscreenFailed") ?? []) {
    listener({ error: "ALREADY_FULLSCREEN" });
  }
  for (const run of timers.slice(1)) {
    run?.();
  }
  assert(calls.includes("exit"), "stale fullscreen clears with exitFullscreen");
  assert(
    calls.filter((call) => call === "request").length >= 2,
    "retries after ALREADY_FULLSCREEN",
  );
}

{
  const calls: string[] = [];
  const timers: Array<() => void> = [];
  const listeners = new Map<
    string,
    Array<(payload?: { error?: string }) => void>
  >();
  const host: TelegramFullscreenHost = {
    isFullscreen: false,
    isVersionAtLeast: () => true,
    requestFullscreen() {
      calls.push("request");
      host.isFullscreen = true;
    },
    onEvent(event, callback) {
      const list = listeners.get(event) ?? [];
      list.push(callback);
      listeners.set(event, list);
    },
    offEvent() {},
  };
  bindHost(host, timers);
  timers[0]?.();
  for (const listener of listeners.get("fullscreenChanged") ?? []) {
    listener();
  }
  timers[1]?.();
  for (const listener of listeners.get("activated") ?? []) {
    listener();
  }
  assert(calls.length === 1, "entered fullscreen is not requested again");
}

console.log("telegram fullscreen ok");
