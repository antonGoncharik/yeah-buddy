import {
  assertGoalSettingsAllowed,
  bodyMassIndex,
  cutGoalBlockedReason,
  UnsafeGoalError,
} from "@/lib/nutrition/goal-safety";

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(label);
  }
}

const sampleBmi = bodyMassIndex(120, 170);
assert(sampleBmi != null && Math.abs(sampleBmi - 41.5) < 0.2, "bmi sample");
assert(
  cutGoalBlockedReason({
    goal: "lose",
    height_cm: 170,
    body_weight_kg: 50,
    birth_year: 1990,
  }) != null,
  "underweight cut blocked",
);
assert(
  cutGoalBlockedReason({
    goal: "lose",
    height_cm: null,
    body_weight_kg: 80,
    birth_year: 2012,
  }) != null,
  "minor cut blocked",
);

try {
  assertGoalSettingsAllowed({
    goal: "lose",
    height_cm: 170,
    body_weight_kg: 50,
    birth_year: 1990,
  });
  assert(false, "should throw");
} catch (error) {
  assert(error instanceof UnsafeGoalError, "unsafe goal error type");
}

console.log("goal safety ok");
