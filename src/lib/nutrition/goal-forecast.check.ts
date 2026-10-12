import assert from "node:assert/strict";

import {
  goalForecastExtension,
  goalForecastLine,
  goalForecastWeeklyKg,
} from "@/lib/nutrition/goal-forecast";

assert(Math.abs(goalForecastWeeklyKg(80, "lose", "normal")) > 0.1);
const ext = goalForecastExtension(80, "lose", "normal", 4);
assert(ext != null && ext.length === 5);
assert(
  goalForecastLine({ weightKg: 80, goal: "lose", pace: "normal" })?.includes(
    "нед.",
  ),
);

export default Promise.resolve();
