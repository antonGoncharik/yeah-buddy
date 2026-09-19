export type HapticKind =
  | "tick"
  | "tap"
  | "commit"
  | "heavy"
  | "success"
  | "warn"
  | "error";

export type HapticCommand =
  | { type: "selection" }
  | { type: "impact"; style: "light" | "medium" | "heavy" }
  | { type: "notification"; style: "success" | "warning" | "error" };

export type HapticEventData =
  | { type: "selection_change" }
  | { type: "impact"; impact_style: "light" | "medium" | "heavy" }
  | {
      type: "notification";
      notification_type: "success" | "warning" | "error";
    };

export type HapticNativeMessage = {
  eventName: string;
  eventType: string;
  eventData: string;
};

export const HAPTIC_EVENT = "web_app_trigger_haptic_feedback";
export const TIMER_DONE_VIBRATE = [240, 90, 240, 90, 420];
export const TIMER_DONE_HAPTICS: ReadonlyArray<{
  delay: number;
  kind: HapticKind;
}> = [
  { delay: 0, kind: "heavy" },
  { delay: 330, kind: "heavy" },
  { delay: 660, kind: "heavy" },
];

type HapticApi = {
  impactOccurred: (style: "light" | "medium" | "heavy") => unknown;
  notificationOccurred: (type: "success" | "warning" | "error") => unknown;
  selectionChanged: () => unknown;
};

type PostMessageHandler = {
  postMessage?: (message: unknown) => void;
};

type TelegramHapticHost = Window & {
  TelegramWebviewProxy?: { postEvent?: (name: string, data: string) => void };
  webkit?: {
    messageHandlers?: {
      performAction?: PostMessageHandler;
      TelegramWebviewProxy?: PostMessageHandler;
    };
  };
  external?: { notify?: (payload: string) => void };
  Telegram?: {
    WebApp?: { HapticFeedback?: HapticApi };
    WebView?: {
      postEvent?: (
        name: string,
        callback: unknown,
        data: HapticEventData,
      ) => void;
    };
  };
};

const COMMANDS: Record<HapticKind, HapticCommand> = {
  tick: { type: "selection" },
  tap: { type: "impact", style: "light" },
  commit: { type: "impact", style: "medium" },
  heavy: { type: "impact", style: "heavy" },
  success: { type: "notification", style: "success" },
  warn: { type: "notification", style: "warning" },
  error: { type: "notification", style: "error" },
};

let hapticApi: HapticApi | null | undefined;
let hapticLoad: Promise<HapticApi | null> | undefined;

export function hapticCommand(kind: HapticKind): HapticCommand {
  return COMMANDS[kind];
}

export function hapticEventData(kind: HapticKind): HapticEventData {
  const command = COMMANDS[kind];
  if (command.type === "selection") {
    return { type: "selection_change" };
  }
  if (command.type === "impact") {
    return { type: "impact", impact_style: command.style };
  }
  return { type: "notification", notification_type: command.style };
}

export function hapticNativeMessage(kind: HapticKind): HapticNativeMessage {
  return {
    eventName: HAPTIC_EVENT,
    eventType: HAPTIC_EVENT,
    eventData: JSON.stringify(hapticEventData(kind)),
  };
}

export function holdTimerStepHaptic(next: number): HapticKind | null {
  if (next === 0) {
    return "success";
  }
  if (next > 0 && next <= 3) {
    return "commit";
  }
  return null;
}

export function hapticTimerDone(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    navigator.vibrate?.([...TIMER_DONE_VIBRATE]);
  } catch {
    // iOS and some WebViews expose vibrate but reject the call.
  }

  for (const step of TIMER_DONE_HAPTICS) {
    if (step.delay === 0) {
      haptic(step.kind);
      continue;
    }
    window.setTimeout(() => haptic(step.kind), step.delay);
  }
}

export function playTimerStepHaptic(next: number): void {
  if (next === 0) {
    hapticTimerDone();
    return;
  }
  const kind = holdTimerStepHaptic(next);
  if (kind) {
    haptic(kind);
  }
}

export function haptic(kind: HapticKind): void {
  if (typeof window === "undefined") {
    return;
  }

  if (postNativeHaptic(hapticEventData(kind))) {
    return;
  }

  const command = COMMANDS[kind];
  const api = hapticApi ?? liveHapticApi();
  if (api) {
    tryPlay(api, command);
    return;
  }

  void loadHaptics().then((loaded) => {
    if (loaded) {
      tryPlay(loaded, command);
    }
  });
}

function postNativeHaptic(data: HapticEventData): boolean {
  const host = window as TelegramHapticHost;
  const message = {
    eventName: HAPTIC_EVENT,
    eventType: HAPTIC_EVENT,
    eventData: JSON.stringify(data),
  };

  // Telegram iOS reads `eventName` from webkit.messageHandlers.performAction.
  // The JS proxy is only a wrapper — and a missing/fake proxy used to swallow taps.
  if (postIosMessage(host.webkit?.messageHandlers?.performAction, message)) {
    return true;
  }
  if (
    postIosMessage(host.webkit?.messageHandlers?.TelegramWebviewProxy, message)
  ) {
    return true;
  }

  try {
    const proxy = host.TelegramWebviewProxy;
    if (proxy?.postEvent) {
      proxy.postEvent(HAPTIC_EVENT, message.eventData);
      return true;
    }
  } catch {
    // Telegram 6.0 mock and old clients throw WebAppMethodUnsupported.
  }

  try {
    const postEvent = host.Telegram?.WebView?.postEvent;
    if (postEvent) {
      postEvent(HAPTIC_EVENT, false, data);
      return true;
    }
  } catch {
    // WebView.postEvent is missing until telegram-web-app.js evaluates.
  }

  try {
    const notify = host.external?.notify;
    if (notify) {
      notify(JSON.stringify({ eventType: HAPTIC_EVENT, eventData: data }));
      return true;
    }
  } catch {
    // Desktop/web Telegram uses other bridges.
  }

  return false;
}

function postIosMessage(
  handler: PostMessageHandler | undefined,
  message: HapticNativeMessage,
): boolean {
  try {
    if (!handler?.postMessage) {
      return false;
    }
    handler.postMessage(message);
    return true;
  } catch {
    return false;
  }
}

function liveHapticApi(): HapticApi | null {
  const api = (window as TelegramHapticHost).Telegram?.WebApp?.HapticFeedback;
  if (
    api &&
    typeof api.impactOccurred === "function" &&
    typeof api.notificationOccurred === "function" &&
    typeof api.selectionChanged === "function"
  ) {
    hapticApi = api;
    return api;
  }
  return null;
}

function tryPlay(api: HapticApi, command: HapticCommand): void {
  try {
    play(api, command);
  } catch {
    // Telegram 6.0 mock and old clients throw WebAppMethodUnsupported.
  }
}

function play(api: HapticApi, command: HapticCommand): void {
  if (command.type === "selection") {
    api.selectionChanged();
    return;
  }
  if (command.type === "impact") {
    api.impactOccurred(command.style);
    return;
  }
  api.notificationOccurred(command.style);
}

function loadHaptics(): Promise<HapticApi | null> {
  if (!hapticLoad) {
    hapticLoad = import("@twa-dev/sdk")
      .then((sdk) => {
        const api = (sdk.default as { HapticFeedback?: HapticApi })
          .HapticFeedback;
        hapticApi = api ?? liveHapticApi();
        return hapticApi ?? null;
      })
      .catch(() => {
        hapticApi = liveHapticApi();
        return hapticApi;
      });
  }
  return hapticLoad;
}

if (typeof window !== "undefined") {
  void loadHaptics();
}
