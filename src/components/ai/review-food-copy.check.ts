import {
  averageSummary,
  averageValue,
  foodSummary,
  foodValue,
  historyDays,
  signedAmount,
} from "@/components/ai/review-food-copy";
import type { ReviewBrief } from "@/lib/ai/types";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const macros = {
  protein: 0,
  fat: 0,
  carbs: 0,
  kcal: 0,
};

const nutrition: ReviewBrief["nutrition"] = {
  logged: 0,
  rest: null,
  training: null,
  protein_hit: 5,
  protein_total: 7,
  kcal_hit: 4,
  kcal_total: 7,
  weight: {
    logged: 0,
    start: null,
    end: null,
    delta: null,
    protein_per_kg: null,
    protein_per_kg_target: null,
  },
  energy: null,
  waist: null,
  halves: null,
  days: [],
  foods: [],
  foods_rest: [],
  foods_training: [],
  meals_rest: [],
  meals_training: [],
};

assertEqual(
  signedAmount(12, (value) => String(value)),
  "+12",
  "plus",
);
assertEqual(
  signedAmount(-3, (value) => String(value)),
  "−3",
  "minus",
);
assertEqual(
  signedAmount(0, (value) => String(value)),
  "0",
  "zero",
);
assertEqual(foodValue({ nutrition }), "5 из 7", "protein hits");
assertEqual(
  foodSummary({ nutrition }),
  "белок · ккал 4 из 7",
  "protein and kcal",
);
assertEqual(
  foodValue({ nutrition: { ...nutrition, protein_total: 0 } }),
  "4 из 7",
  "kcal hits",
);
assertEqual(averageValue({ nutrition }), null, "no averages");
assertEqual(averageSummary({ nutrition }), null, "no average summary");

const training = {
  count: 2,
  fact: { ...macros, kcal: 900 },
  target: macros,
};
assertEqual(
  averageValue({ nutrition: { ...nutrition, training } }),
  "900",
  "training kcal",
);
assertEqual(
  averageSummary({ nutrition: { ...nutrition, training } }),
  "зал",
  "training label",
);

assertEqual(
  historyDays([
    {
      date: "2026-01-02",
      training: true,
      protein: 140,
      protein_target: 160,
      fat: 50,
      fat_target: 60,
      carbs: 180,
      carbs_target: 200,
      kcal: 2100,
      kcal_target: 2300,
      weight: 80,
      waist: null,
    },
  ]),
  [
    {
      date: "2026-01-02",
      is_training_day: true,
      target_protein: 160,
      target_fat: 60,
      target_carbs: 200,
      target_kcal: 2300,
      body_weight: 80,
      waist_cm: null,
      caught_up: false,
      fact_protein: 140,
      fact_fat: 50,
      fact_carbs: 180,
      fact_kcal: 2100,
    },
  ],
  "history row",
);
