import {
  effectiveTrainingDay,
  gymFeaturesEnabled,
  parseGymEnabled,
  resolveDayTypeForUser,
} from "@/lib/settings/gym-mode";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(parseGymEnabled(true), true, "true");
assertEqual(parseGymEnabled(false), false, "false");
assertEqual(parseGymEnabled(null), true, "null defaults on");
assertEqual(parseGymEnabled(undefined), true, "undefined defaults on");

const gymOn = { gym_enabled: true };
const gymOff = { gym_enabled: false };

assertEqual(gymFeaturesEnabled(gymOn), true, "features on");
assertEqual(gymFeaturesEnabled(gymOff), false, "features off");
assertEqual(gymFeaturesEnabled(null), true, "missing settings");

assertEqual(
  effectiveTrainingDay(gymOff, { is_training_day: true }),
  false,
  "food-only ignores training flag",
);
assertEqual(
  effectiveTrainingDay(gymOn, { is_training_day: true }),
  true,
  "gym on respects training",
);

assertEqual(resolveDayTypeForUser(gymOff, "training"), "rest", "force rest");
assertEqual(resolveDayTypeForUser(gymOn, "training"), "training", "keep type");

console.log("gym mode ok");
