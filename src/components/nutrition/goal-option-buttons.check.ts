import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  GOAL_OPTION_SELECTED_CLASS,
  GOAL_OPTION_UNSELECTED_CLASS,
} from "@/components/nutrition/goal-option-buttons";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const goalButtonsSource = readFileSync(
  join(process.cwd(), "src/components/nutrition/goal-option-buttons.tsx"),
  "utf8",
);
assert(
  goalButtonsSource.includes("bg-primary text-primary-foreground"),
  "goal tiles document filled selected style",
);
assert(
  !goalButtonsSource.includes("ring-"),
  "goal tiles must not use ring outline for selection",
);

const settingsSource = readFileSync(
  join(process.cwd(), "src/components/settings/settings-goals-form.tsx"),
  "utf8",
);
assert(
  settingsSource.includes("GoalOptionButtons"),
  "settings goal picker shares GoalOptionButtons",
);
assert(
  !settingsSource.includes("ring-2 ring-primary"),
  "settings goal picker must not use ring outline",
);

const onboardingFoodSource = readFileSync(
  join(process.cwd(), "src/components/onboarding/onboarding-food-step.tsx"),
  "utf8",
);
assert(
  onboardingFoodSource.includes("GoalOptionButtons"),
  "onboarding goal step shares GoalOptionButtons",
);
assert(
  !onboardingFoodSource.includes("ONBOARDING_GOAL_OPTIONS.map"),
  "onboarding does not duplicate goal option list",
);

assert(
  GOAL_OPTION_SELECTED_CLASS.includes("bg-primary"),
  "selected goal uses primary fill",
);
assert(GOAL_OPTION_UNSELECTED_CLASS.length > 0, "unselected goal style exported");

console.log("goal option buttons ok");
