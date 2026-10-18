import {
  dailyGoalShiftKcal,
  macroGoalsForTargetKcal,
  suggestFatGrams,
  suggestMacroGoals,
  suggestProteinGrams,
  suggestRestKcal,
} from "@/lib/nutrition/suggest-protein";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  suggestProteinGrams({ sex: "male", weightKg: 80, goal: "keep" }),
  145,
  "80 kg man keep → 1.8 g/kg",
);
assertEqual(
  suggestProteinGrams({ sex: "female", weightKg: 80, goal: "keep" }),
  145,
  "80 kg woman keep → 1.8 g/kg, same scale as men",
);
assertEqual(
  suggestProteinGrams({ sex: "male", weightKg: 80, goal: "lose" }),
  160,
  "cut is 2 g/kg",
);
assertEqual(
  suggestProteinGrams({ sex: "male", weightKg: 80, goal: "gain" }),
  130,
  "gain is 1.6 g/kg",
);
assertEqual(
  suggestProteinGrams({ sex: "male", weightKg: 20, goal: "keep" }),
  null,
  "too light",
);
assertEqual(
  suggestProteinGrams({ sex: "male", weightKg: 300, goal: "keep" }),
  null,
  "too heavy",
);

assertEqual(
  suggestFatGrams({ sex: "male", weightKg: 80, goal: "keep" }),
  70,
  "80 × 0.9 → 72 → 70",
);
assertEqual(
  suggestFatGrams({ sex: "female", weightKg: 80, goal: "keep" }),
  70,
  "80 × 0.9 → 72 → 70, no sex haircut",
);
assertEqual(
  suggestRestKcal({ sex: "male", weightKg: 80, goal: "keep" }),
  2640,
  "80 × 33 maintenance",
);
assertEqual(
  dailyGoalShiftKcal({ weightKg: 80, goal: "lose", goal_pace: "normal" }),
  -440,
  "80 kg normal cut is capped at 0.4 kg a week",
);
assertEqual(
  dailyGoalShiftKcal({ weightKg: 80, goal: "lose", goal_pace: "fast" }),
  -660,
  "fast cut stays inside the 0.7 kg cap",
);
assertEqual(
  dailyGoalShiftKcal({ weightKg: 60, goal: "lose", goal_pace: "slow" }),
  -275,
  "light slow cut is lifted to 0.25 kg a week",
);
assertEqual(
  suggestRestKcal({
    sex: "male",
    weightKg: 80,
    goal: "lose",
    goal_pace: "normal",
  }),
  2200,
  "carb floor keeps the rest goal from falling further",
);
assertEqual(
  suggestRestKcal({
    sex: "male",
    weightKg: 80,
    goal: "lose",
    goal_pace: "normal",
    activity_level: "moderate",
    height_cm: 180,
    birth_year: 1996,
  }),
  2230,
  "mifflin maintenance minus the capped cut",
);

const goals = suggestMacroGoals({
  sex: "male",
  weightKg: 80,
  goal: "keep",
});
assert(goals != null, "goals exist");
assertEqual(goals?.protein, 145, "protein matches");
assertEqual(goals?.rest.fat, 70, "rest fat from weight");
assertEqual(goals?.rest.carbs, 360, "rest carbs fill kcal");
assertEqual(goals?.training.fat, 70, "training fat same");
assertEqual(goals?.training.carbs, 410, "training +50 carbs");
assert(
  goals != null && goals.training.kcal > goals.rest.kcal,
  "training day has more carbs → more kcal",
);

const custom = suggestMacroGoals({
  sex: "male",
  weightKg: 80,
  goal: "keep",
  protein: 180,
});
assertEqual(custom?.protein, 180, "custom protein kept");
assertEqual(custom?.rest.fat, 70, "fat still from weight");
assert(
  custom != null && custom.rest.carbs < (goals?.rest.carbs ?? 0),
  "more protein → fewer carbs to hit the same kcal",
);

const lose = suggestMacroGoals({
  sex: "male",
  weightKg: 80,
  goal: "lose",
});
const gain = suggestMacroGoals({
  sex: "male",
  weightKg: 80,
  goal: "gain",
});
assert(
  lose != null && gain != null && lose.rest.kcal < gain.rest.kcal,
  "cut below bulk",
);

const anchored = macroGoalsForTargetKcal({
  targetKcal: 1970,
  weightKg: 80,
  goal: "lose",
  sex: "male",
  currentProtein: 150,
  currentFat: 70,
});
assertEqual(anchored.protein, 160, "energy update bumps protein to g/kg");
assertEqual(anchored.carbs, 175, "carbs absorb the cut");

const customFloor = macroGoalsForTargetKcal({
  targetKcal: 1970,
  weightKg: 80,
  goal: "lose",
  sex: "male",
  currentProtein: 200,
  currentFat: 70,
});
assertEqual(customFloor.protein, 200, "energy update never lowers protein");

const heavyWithHeight = macroGoalsForTargetKcal({
  targetKcal: 1800,
  weightKg: 120,
  height_cm: 170,
  goal: "lose",
  sex: "female",
  currentProtein: 150,
  currentFat: 60,
});
const heavyNoHeight = macroGoalsForTargetKcal({
  targetKcal: 1800,
  weightKg: 120,
  goal: "lose",
  sex: "female",
  currentProtein: 150,
  currentFat: 60,
});
assert(
  heavyWithHeight.protein < heavyNoHeight.protein,
  "height caps protein via reference weight",
);

console.log("suggest protein ok");
