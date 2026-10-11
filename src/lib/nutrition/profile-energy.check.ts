import {
  mifflinRestKcal,
  referenceBodyWeightKg,
  weeklyBodyRate,
} from "@/lib/nutrition/profile-energy";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

assert(
  referenceBodyWeightKg({ sex: "female", weightKg: 120, height_cm: null }) ===
    85,
  "120 kg woman without height caps protein base at 85",
);
assert(
  referenceBodyWeightKg({ sex: "female", weightKg: 120, height_cm: 170 }) < 80,
  "tall woman uses BMI 27 cap",
);
assert(
  mifflinRestKcal({
    sex: "male",
    weightKg: 70,
    height_cm: 175,
    birth_year: 1990,
    activity: "moderate",
    nowYear: 2026,
  }) != null,
  "mifflin for typical male",
);
assert(
  weeklyBodyRate("lose", "fast") < weeklyBodyRate("lose", "slow"),
  "fast cut is steeper",
);

console.log("profile energy ok");
