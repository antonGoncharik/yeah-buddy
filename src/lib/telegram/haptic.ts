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

const COMMANDS: Record<HapticKind, HapticCommand> = {
  tick: { type: "selection" },
  tap: { type: "impact", style: "light" },
  commit: { type: "impact", style: "medium" },
  heavy: { type: "impact", style: "heavy" },
  success: { type: "notification", style: "success" },
  warn: { type: "notification", style: "warning" },
  error: { type: "notification", style: "error" },
};

let hapticLoad: Promise<HapticApi | null> | undefined;

export function hapticCommand(kind: HapticKind): HapticCommand {
  return COMMANDS[kind];
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

  void loadHaptics().then((api) => {
    if (!api) {
      return;
    }
    for (const step of TIMER_DONE_HAPTICS) {
      window.setTimeout(() => {
        try {
          play(api, hapticCommand(step.kind));
        } catch {
          // Telegram 6.0 mock and old clients throw WebAppMethodUnsupported.
        }
      }, step.delay);
    }
  });
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

  const command = COMMANDS[kind];
  void loadHaptics().then((api) => {
    if (!api) {
      return;
    }
    try {
      play(api, command);
    } catch {
      // Telegram 6.0 mock and old clients throw WebAppMethodUnsupported.
    }
  });
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
        return api ?? null;
      })
      .catch(() => null);
  }
  return hapticLoad;
}

if (typeof window !== "undefined") {
  void loadHaptics();
}
