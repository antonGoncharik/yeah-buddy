import { priorFoodLogDays } from "@/lib/retention/habit";
import {
  lighterPlannedWeight,
  pauseCovers,
  pauseReturnDue,
  pauseUntilDate,
} from "@/lib/retention/pause";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  pauseUntilDate("2026-10-15", 7),
  "2026-10-21",
  "seven days include today",
);
assertEqual(
  pauseCovers("2026-10-18", "2026-10-15", "2026-10-21"),
  true,
  "inside",
);
assertEqual(
  pauseCovers("2026-10-22", "2026-10-15", "2026-10-21"),
  false,
  "after",
);
assertEqual(
  pauseReturnDue("2026-10-22", "2026-10-21", true),
  true,
  "offer after",
);
assertEqual(
  pauseReturnDue("2026-10-20", "2026-10-21", true),
  false,
  "still paused",
);
assertEqual(lighterPlannedWeight(100, 2.5), 90, "ten percent on the step");
assertEqual(
  lighterPlannedWeight(20, 2.5),
  17.5,
  "small weight still steps down",
);

const days = [
  {
    date: "2026-10-12",
    fact_protein: 1,
    fact_fat: 0,
    fact_carbs: 0,
    fact_kcal: 1800,
    target_kcal: 2000,
  },
  {
    date: "2026-10-13",
    fact_protein: 1,
    fact_fat: 0,
    fact_carbs: 0,
    fact_kcal: 1800,
    target_kcal: 2000,
  },
  {
    date: "2026-10-16",
    fact_protein: 1,
    fact_fat: 0,
    fact_carbs: 0,
    fact_kcal: 1800,
    target_kcal: 2000,
  },
];
assertEqual(
  priorFoodLogDays(days, "2026-10-17", {
    from: "2026-10-14",
    until: "2026-10-15",
  }),
  3,
  "a pause day does not snap the streak",
);
assertEqual(
  priorFoodLogDays(days, "2026-10-17"),
  1,
  "without a pause the gap stops it",
);
