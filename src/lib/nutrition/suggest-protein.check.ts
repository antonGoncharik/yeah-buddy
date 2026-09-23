import {
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
  130,
  "80 kg woman keep → 1.8 × 0.9",
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
  65,
  "80 × 0.9 × 0.9 → 64.8 → 65",
);
assertEqual(
  suggestRestKcal({ sex: "male", weightKg: 80, goal: "keep" }),
  2640,
  "80 × 33",
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
  lose != null &&
    gain != null &&
    lose.rest.kcal < gain.rest.kcal,
  "cut below bulk",
);

console.log("suggest protein ok");
