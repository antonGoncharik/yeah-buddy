import { trainingExtraCarbsG } from "@/lib/nutrition/suggest-protein";
import { carbsForDay } from "@/lib/nutrition/training-day";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  trainingExtraCarbsG({ goal: "keep" }),
  50,
  "maintenance gym day keeps 50 g",
);
assertEqual(
  trainingExtraCarbsG({ goal: "lose" }),
  25,
  "a cut does not spend the whole deficit on the gym day",
);
assertEqual(
  trainingExtraCarbsG({ goal: "gain" }),
  75,
  "a bulk adds more carbs on a gym day",
);
assertEqual(
  trainingExtraCarbsG({ goal: "lose", load: "home" }),
  0,
  "home training does not add carbs",
);
assertEqual(
  carbsForDay({
    dayType: "training",
    restCarbs: 200,
    trainingCarbs: 225,
    deload: true,
  }),
  200,
  "deload uses rest carbs",
);
assertEqual(
  carbsForDay({
    dayType: "training",
    restCarbs: 200,
    trainingCarbs: 225,
    deload: false,
  }),
  225,
  "a normal gym day keeps the bump",
);

console.log("training day carbs ok");
