import {
  isTelegramAppWebViewLaunch,
  isTelegramKeyboardWebAppLaunch,
} from "@/lib/telegram/launch-context";
import {
  HAPTIC_EVENT,
  hapticCommand,
  hapticEventData,
  hapticNativeMessage,
  holdTimerStepHaptic,
  resolveHapticCommand,
  TIMER_DONE_HAPTICS,
  TIMER_DONE_VIBRATE,
} from "@/lib/telegram/haptic";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(hapticCommand("tick"), { type: "selection" }, "tick");
assertEqual(hapticCommand("tap"), { type: "impact", style: "light" }, "tap");
assertEqual(
  hapticCommand("commit"),
  { type: "impact", style: "medium" },
  "commit",
);
assertEqual(
  hapticCommand("heavy"),
  { type: "impact", style: "heavy" },
  "heavy",
);
assertEqual(
  hapticCommand("success"),
  { type: "notification", style: "success" },
  "success",
);
assertEqual(
  hapticCommand("warn"),
  { type: "notification", style: "warning" },
  "warn",
);
assertEqual(
  hapticCommand("error"),
  { type: "notification", style: "error" },
  "error",
);

assertEqual(
  hapticEventData("tick"),
  { type: "selection_change" },
  "native tick",
);
const fakeWindow = {
  Telegram: {
    WebView: { initParams: { tgWebAppPlatform: "android" } },
    WebApp: { initDataUnsafe: { start_param: "open" } },
  },
};
Object.defineProperty(globalThis, "window", {
  value: fakeWindow as Window,
  configurable: true,
});
Object.defineProperty(globalThis, "navigator", {
  value: { userAgent: "Telegram-Android" },
  configurable: true,
});

assertEqual(isTelegramAppWebViewLaunch(), true, "android app webview detect");
assertEqual(
  resolveHapticCommand("tap"),
  { type: "notification", style: "success" },
  "android app webview maps tap to notification",
);

fakeWindow.Telegram.WebApp.initDataUnsafe = {};
assertEqual(
  isTelegramKeyboardWebAppLaunch(),
  true,
  "android bot keyboard detect",
);
assertEqual(
  resolveHapticCommand("tap"),
  { type: "notification", style: "success" },
  "android maps tap to notification even on bot keyboard",
);

assertEqual(
  hapticEventData("tap"),
  { type: "notification", notification_type: "success" },
  "android native tap",
);
assertEqual(
  hapticEventData("commit"),
  { type: "notification", notification_type: "warning" },
  "android native commit",
);
assertEqual(
  hapticEventData("heavy"),
  { type: "notification", notification_type: "error" },
  "android native heavy",
);
assertEqual(
  hapticEventData("success"),
  { type: "notification", notification_type: "success" },
  "native success",
);
assertEqual(
  hapticEventData("warn"),
  { type: "notification", notification_type: "warning" },
  "native warn",
);
assertEqual(
  hapticEventData("error"),
  { type: "notification", notification_type: "error" },
  "native error",
);

assertEqual(
  hapticNativeMessage("tap"),
  {
    eventName: HAPTIC_EVENT,
    eventType: HAPTIC_EVENT,
    eventData: JSON.stringify({
      type: "notification",
      notification_type: "success",
    }),
  },
  "ios native tap message",
);
assertEqual(
  JSON.parse(hapticNativeMessage("tick").eventData),
  { type: "notification", notification_type: "success" },
  "android maps tick to notification",
);

assertEqual(holdTimerStepHaptic(6), null, "early hold second is silent");
assertEqual(holdTimerStepHaptic(4), null, "fourth second is silent");
assertEqual(holdTimerStepHaptic(3), "commit", "last three start");
assertEqual(holdTimerStepHaptic(1), "commit", "last second");
assertEqual(holdTimerStepHaptic(0), "success", "hold done");
assertEqual(holdTimerStepHaptic(-1), null, "invalid leftover");

assertEqual(TIMER_DONE_VIBRATE.length, 5, "timer done vibrate pulses");
assertEqual(TIMER_DONE_HAPTICS.length, 3, "timer done haptic pulses");
assertEqual(TIMER_DONE_HAPTICS[0]?.kind, "heavy", "first done pulse");
assertEqual(TIMER_DONE_HAPTICS[2]?.kind, "heavy", "last done pulse");
assertEqual(
  TIMER_DONE_HAPTICS.every((step, index) => {
    const prev = TIMER_DONE_HAPTICS[index - 1];
    return prev == null || step.delay > prev.delay;
  }),
  true,
  "done pulses are staggered",
);

console.log("telegram haptic ok");
