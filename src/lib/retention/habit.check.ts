import {
  buildEarlyHabitSnapshot,
  earlyHabitFoodMilestone,
  foodLogStreakAtRisk,
  foodStreakLabel,
  inEarlyHabitWindow,
  liveFoodLogStreak,
  priorFoodLogDays,
} from "@/lib/retention/habit";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(inEarlyHabitWindow(0), true, "day 1");
assertEqual(inEarlyHabitWindow(13), true, "day 14");
assertEqual(inEarlyHabitWindow(14), false, "day 15");
assertEqual(inEarlyHabitWindow(null), false, "unknown");

const days = [
  {
    date: "2026-10-04",
    fact_protein: 10,
    fact_fat: 0,
    fact_carbs: 0,
    fact_kcal: 100,
  },
  {
    date: "2026-10-05",
    fact_protein: 10,
    fact_fat: 0,
    fact_carbs: 0,
    fact_kcal: 100,
  },
];
assertEqual(priorFoodLogDays(days, "2026-10-06"), 2, "two prior food days");
assertEqual(liveFoodLogStreak(true, 2), 3, "today logged extends");
assertEqual(liveFoodLogStreak(false, 2), 2, "today empty keeps yesterday");
assertEqual(
  foodLogStreakAtRisk(false, 2),
  true,
  "at risk when empty today",
);
assertEqual(
  earlyHabitFoodMilestone(3),
  "Три дня с едой в дневнике — привычка цепляется.",
  "food milestone 3",
);
assertEqual(
  buildEarlyHabitSnapshot({
    accountAgeDays: 2,
    todayHasFood: false,
    priorFoodLogDays: 1,
    todayProteinClosed: false,
    priorProteinHits: 1,
    gymSessionsWeek: 0,
  }).foodAtRisk,
  true,
  "snapshot at risk",
);
assertEqual(
  foodStreakLabel(0, false).includes("Запиши"),
  true,
  "empty streak hint",
);

console.log("early habit ok");
