import { isAndroidTelegram } from "@/lib/telegram/launch-context";

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

const NAVIGATOR_FALLBACK_MS: Record<HapticKind, number | number[]> = {
  tick: 6,
  tap: 10,
  commit: 16,
  heavy: [18, 35, 18],
  success: [12, 28, 12],
  warn: [14, 40, 14],
  error: [22, 55, 22],
};

let hapticApi: HapticApi | null | undefined;
let hapticLoad: Promise<HapticApi | null> | undefined;

export function hapticCommand(kind: HapticKind): HapticCommand {
  return COMMANDS[kind];
}

/**
 * Android requestAppWebView ignores impact/selection haptics (Telegram client bug).
 * Map them to notification + navigator.vibrate for chat-list / home-screen opens.
 */
export function resolveHapticCommand(kind: HapticKind): HapticCommand {
  const base = COMMANDS[kind];
  // requestAppWebView and requestWebView share the same initData on Android;
  // impact/selection are unreliable on the client, notification is not.
  if (!isAndroidTelegram()) {
    return base;
  }
  if (base.type === "notification") {
    return base;
  }
  if (base.type === "selection") {
    return { type: "notification", style: "success" };
  }
  if (base.style === "heavy") {
    return { type: "notification", style: "error" };
  }
  if (base.style === "medium") {
    return { type: "notification", style: "warning" };
  }
  return { type: "notification", style: "success" };
}

export function hapticEventDataFromCommand(
  command: HapticCommand,
): HapticEventData {
  if (command.type === "selection") {
    return { type: "selection_change" };
  }
  if (command.type === "impact") {
    return { type: "impact", impact_style: command.style };
  }
  return { type: "notification", notification_type: command.style };
}

export function hapticEventData(kind: HapticKind): HapticEventData {
  return hapticEventDataFromCommand(resolveHapticCommand(kind));
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

export function clearHapticApiCache(): void {
  hapticApi = undefined;
  hapticLoad = undefined;
}

export function haptic(kind: HapticKind): void {
  if (typeof window === "undefined") {
    return;
  }

  const play = () => {
    const command = resolveHapticCommand(kind);
    const eventData = hapticEventDataFromCommand(command);

    if (isAndroidTelegram()) {
      postNativeHaptic(eventData);
      const sdkApi = liveHapticApi();
      if (sdkApi && telegramHapticApiReady()) {
        tryPlay(sdkApi, command);
      } else {
        const api = hapticApi ?? sdkApi;
        if (api) {
          tryPlay(api, command);
        } else {
          void loadHaptics().then((loaded) => {
            if (loaded) {
              tryPlay(loaded, command);
            }
          });
        }
      }
      if (shouldUseNavigatorHapticFallback(kind)) {
        playNavigatorHapticFallback(kind);
      }
      return;
    }

    const sdkApi = liveHapticApi();
    if (sdkApi && telegramHapticApiReady()) {
      tryPlay(sdkApi, command);
      return;
    }

    if (postNativeHaptic(eventData)) {
      return;
    }

    const api = hapticApi ?? sdkApi;
    if (api) {
      tryPlay(api, command);
      return;
    }

    void loadHaptics().then((loaded) => {
      if (loaded) {
        tryPlay(loaded, command);
      }
    });
  };

  whenTelegramWebAppActive(play);
}

function shouldUseNavigatorHapticFallback(kind: HapticKind): boolean {
  if (!isAndroidTelegram()) {
    return false;
  }
  return COMMANDS[kind].type !== "notification";
}

type TelegramActiveHost = {
  isActive?: boolean;
  onEvent?: (event: string, callback: () => void) => void;
  offEvent?: (event: string, callback: () => void) => void;
};

function whenTelegramWebAppActive(play: () => void): void {
  const webApp = (window as TelegramHapticHost).Telegram?.WebApp as
    | TelegramActiveHost
    | undefined;
  if (!webApp || webApp.isActive !== false) {
    play();
    return;
  }
  const onActivated = () => {
    webApp.offEvent?.("activated", onActivated);
    play();
  };
  webApp.onEvent?.("activated", onActivated);
}

function playNavigatorHapticFallback(kind: HapticKind): void {
  const pattern = NAVIGATOR_FALLBACK_MS[kind];
  try {
    if (Array.isArray(pattern)) {
      navigator.vibrate?.([...pattern]);
      return;
    }
    navigator.vibrate?.(pattern);
  } catch {
    // Some WebViews expose vibrate but reject the call.
  }
}

function telegramHapticApiReady(): boolean {
  const webApp = (window as TelegramHapticHost).Telegram?.WebApp as
    | { isVersionAtLeast?: (version: string) => boolean }
    | undefined;
  if (!webApp?.isVersionAtLeast) {
    return true;
  }
  return webApp.isVersionAtLeast("6.1");
}

function postNativeHaptic(data: HapticEventData): boolean {
  const host = window as TelegramHapticHost;
  const message = {
    eventName: HAPTIC_EVENT,
    eventType: HAPTIC_EVENT,
    eventData: JSON.stringify(data),
  };

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
    const notify = host.external?.notify;
    if (notify) {
      notify(JSON.stringify({ eventType: HAPTIC_EVENT, eventData: data }));
      return true;
    }
  } catch {
    // Legacy Android WebView builds use external.notify.
  }

  // Telegram iOS reads `eventName` from webkit.messageHandlers.performAction.
  if (postIosMessage(host.webkit?.messageHandlers?.performAction, message)) {
    return true;
  }
  if (
    postIosMessage(host.webkit?.messageHandlers?.TelegramWebviewProxy, message)
  ) {
    return true;
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
    hapticLoad = import("@/lib/telegram/webapp")
      .then(({ loadTelegramWebApp }) => loadTelegramWebApp())
      .then((webApp) => {
        const api = webApp.HapticFeedback;
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
  void import("@/lib/telegram/webapp")
    .then(({ ensureTelegramSdkPrimed }) => {
      ensureTelegramSdkPrimed();
      return loadHaptics();
    })
    .catch(() => loadHaptics());
}
