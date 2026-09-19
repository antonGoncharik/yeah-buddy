import {
  HAPTIC_EVENT,
  hapticCommand,
  hapticEventData,
  hapticNativeMessage,
  holdTimerStepHaptic,
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
assertEqual(
  hapticEventData("tap"),
  { type: "impact", impact_style: "light" },
  "native tap",
);
assertEqual(
  hapticEventData("commit"),
  { type: "impact", impact_style: "medium" },
  "native commit",
);
assertEqual(
  hapticEventData("heavy"),
  { type: "impact", impact_style: "heavy" },
  "native heavy",
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
    eventData: JSON.stringify({ type: "impact", impact_style: "light" }),
  },
  "ios native tap message",
);
assertEqual(
  JSON.parse(hapticNativeMessage("tick").eventData),
  { type: "selection_change" },
  "ios native tick payload stays a json string",
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
