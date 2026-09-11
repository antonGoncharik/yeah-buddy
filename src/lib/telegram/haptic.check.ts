import { hapticCommand, holdTimerStepHaptic } from "@/lib/telegram/haptic";

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

assertEqual(holdTimerStepHaptic(6), null, "early hold second is silent");
assertEqual(holdTimerStepHaptic(4), null, "fourth second is silent");
assertEqual(holdTimerStepHaptic(3), "commit", "last three start");
assertEqual(holdTimerStepHaptic(1), "commit", "last second");
assertEqual(holdTimerStepHaptic(0), "success", "hold done");
assertEqual(holdTimerStepHaptic(-1), null, "invalid leftover");

console.log("telegram haptic ok");
