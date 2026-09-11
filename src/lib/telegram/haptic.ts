export type HapticKind =
  | "tick"
  | "tap"
  | "commit"
  | "success"
  | "warn"
  | "error";

export type HapticCommand =
  | { type: "selection" }
  | { type: "impact"; style: "light" | "medium" }
  | { type: "notification"; style: "success" | "warning" | "error" };

type HapticApi = {
  impactOccurred: (style: "light" | "medium" | "heavy") => unknown;
  notificationOccurred: (type: "success" | "warning" | "error") => unknown;
  selectionChanged: () => unknown;
};

const COMMANDS: Record<HapticKind, HapticCommand> = {
  tick: { type: "selection" },
  tap: { type: "impact", style: "light" },
  commit: { type: "impact", style: "medium" },
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
