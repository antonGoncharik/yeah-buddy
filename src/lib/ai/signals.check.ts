import { formatG } from "@/lib/ai/format";
import { buildSignals, reviewCoverage } from "@/lib/ai/signals";
import type { DayHistoryRow } from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

function day(input: {
  date: string;
  training?: boolean;
  protein: number;
  targetProtein: number;
  carbs?: number;
  targetCarbs?: number;
  kcal?: number;
  targetKcal?: number;
}): DayHistoryRow {
  return {
    date: input.date,
    is_training_day: input.training ?? false,
    target_protein: input.targetProtein,
    target_fat: 70,
    target_carbs: input.targetCarbs ?? 130,
    target_kcal: input.targetKcal ?? 2000,
    fact_protein: input.protein,
    fact_fat: 70,
    fact_carbs: input.carbs ?? 130,
    fact_kcal: input.kcal ?? 2000,
  };
}

assertEqual(reviewCoverage(0, 0), "empty", "empty log");
assertEqual(reviewCoverage(2, 1), "thin", "thin log");
assertEqual(reviewCoverage(4, 2), "thin", "thin still");
assertEqual(reviewCoverage(7, 1), "ok", "enough days");
assertEqual(reviewCoverage(3, 3), "ok", "enough gym");

const proteinDays = [
  day({ date: "2026-09-01", protein: 150, targetProtein: 200 }),
  day({ date: "2026-09-02", protein: 210, targetProtein: 200 }),
  day({ date: "2026-09-03", protein: 120, targetProtein: 200, training: true }),
];

const lines = buildSignals({
  days: proteinDays,
  rest: {
    count: 2,
    fact: { protein: 180, fat: 70, carbs: 130, kcal: 2000 },
    target: { protein: 200, fat: 70, carbs: 130, kcal: 2000 },
  },
  training: {
    count: 1,
    fact: { protein: 120, fat: 70, carbs: 90, kcal: 1800 },
    target: { protein: 200, fat: 70, carbs: 200, kcal: 2200 },
  },
  proteinHit: 1,
  proteinTotal: 3,
  kcalHit: 2,
  kcalTotal: 3,
  foods: [{ name: "Творог", protein: 80, kcal: 400, grams: 400 }],
  gym: {
    completed: 3,
    skipped: 1,
    planHit: 10,
    planTotal: 20,
    templates: [{ name: "Молот", count: 2 }],
    weak: ["Молот"],
  },
  phase: {
    macro: null,
    phase: {
      id: "p",
      user_id: "u",
      macro_cycle_id: "m",
      phase_type: "volume",
      name: null,
      start_date: "2026-09-01",
      end_date: null,
      status: "current",
      sort_order: 2,
      created_at: "2026-09-01",
    },
    phases: [],
    maxes: [],
    phase_circle: {
      phase_type: "volume",
      phase_name: "Набор",
      next_phase_type: "peak",
      next_phase_name: "Рывок",
      last_in_cycle: false,
      increases_on_end: true,
      completed_count: 4,
      circle_size: 6,
      suggest_end: true,
    },
    last_recap: null,
  },
  maxes: {
    grown: [{ name: "Блок", percent: 6, delta: 5 }],
    stalled: [{ name: "Молот", percent: 0, delta: 0 }],
  },
});

assertEqual(
  lines.some((line) => line === "Белок дотянули: 1 из 3 дней."),
  true,
  "protein hit",
);
assertEqual(
  lines.some((line) => line.includes("углеводов не хватало на 110 г")),
  true,
  "training carbs",
);
assertEqual(
  lines.some((line) => line.includes("Топ белка: Творог 80 г")),
  true,
  "foods",
);
assertEqual(
  lines.some((line) => line.includes("Слабее плана: Молот")),
  true,
  "weak template",
);
assertEqual(
  lines.some((line) => line.includes("круг можно закрыть")),
  true,
  "phase end",
);
assertEqual(
  lines.some(
    (line) => line.includes(`Мало белка`) && line.includes(formatG(80)),
  ),
  true,
  "protein holes",
);

console.log("ai signals ok");
