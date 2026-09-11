import { formatG } from "@/lib/ai/format";
import { reviewPromptPayload } from "@/lib/ai/prompt";
import {
  buildReviewBrief,
  buildSignals,
  reviewCoverage,
} from "@/lib/ai/signals";
import type { ReviewMaxRow } from "@/lib/ai/types";
import type { DayHistoryRow } from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

function maxRow(input: Partial<ReviewMaxRow> & { name: string }): ReviewMaxRow {
  return {
    name: input.name,
    percent: input.percent ?? null,
    relative_percent: input.relative_percent ?? null,
    delta: input.delta ?? null,
    start: input.start ?? null,
    current: input.current ?? null,
    start_relative: input.start_relative ?? null,
    current_relative: input.current_relative ?? null,
  };
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
  weight?: number | null;
}): DayHistoryRow {
  return {
    date: input.date,
    is_training_day: input.training ?? false,
    target_protein: input.targetProtein,
    target_fat: 70,
    target_carbs: input.targetCarbs ?? 130,
    target_kcal: input.targetKcal ?? 2000,
    body_weight: input.weight ?? null,
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
  weight: {
    logged: 0,
    start: null,
    end: null,
    delta: null,
    protein_per_kg: null,
    protein_per_kg_target: null,
  },
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
    last_recap: {
      macro_id: "m",
      number: 1,
      start_date: "2026-07-01",
      end_date: "2026-08-20",
      from_phase: "ramp",
      to_phase: "deload",
      from_name: "Разгон",
      to_name: "Сброс",
      gains: [],
      grown_count: 3,
      avg_percent: 5,
    },
  },
  maxes: {
    grown: [maxRow({ name: "Блок", percent: 6, delta: 5 })],
    stalled: [maxRow({ name: "Молот", percent: 0, delta: 0 })],
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
  lines.some((line) =>
    line.includes("Прошлый цикл «Разгон» → «Сброс»: рабочие +5%"),
  ),
  true,
  "last recap",
);
assertEqual(
  lines.some((line) =>
    line.includes("Отдых · 2: 2000/2000 ккал, белок 180/200 г."),
  ),
  true,
  "rest averages",
);
assertEqual(
  lines.some(
    (line) => line.includes(`Мало белка`) && line.includes(formatG(80)),
  ),
  true,
  "protein holes",
);

const recompLines = buildSignals({
  days: [
    day({ date: "2026-09-01", protein: 160, targetProtein: 160, weight: 84 }),
    day({ date: "2026-09-05", protein: 160, targetProtein: 160, weight: 82 }),
    day({ date: "2026-09-10", protein: 160, targetProtein: 160, weight: 81 }),
  ],
  rest: null,
  training: null,
  proteinHit: 2,
  proteinTotal: 2,
  kcalHit: 2,
  kcalTotal: 2,
  weight: {
    logged: 3,
    start: 84,
    end: 81,
    delta: -3,
    protein_per_kg: 1.9,
    protein_per_kg_target: 1.9,
  },
  foods: [],
  gym: {
    completed: 4,
    skipped: 0,
    planHit: 12,
    planTotal: 12,
    templates: [{ name: "Тело A", count: 2 }],
    weak: [],
    feels: { easy: 2, close: 1, miss: 0 },
  },
  phase: {
    macro: null,
    phase: null,
    phases: [],
    maxes: [],
    phase_circle: null,
    last_recap: null,
  },
  maxes: {
    grown: [
      maxRow({ name: "Присед", percent: 4, relative_percent: 6, delta: 5 }),
    ],
    stalled: [],
  },
  avgRelativePercent: 6,
});

assertEqual(
  recompLines.some(
    (line) => line.includes("Легко 2") || line.includes("легко 2"),
  ),
  true,
  "feel summary",
);
assertEqual(
  recompLines.some((line) => line.includes("можно поднять рабочий")),
  true,
  "easy without cycle suggests raise",
);
assertEqual(
  recompLines.some((line) => line.includes("рабочие выросли")),
  true,
  "recomp",
);
assertEqual(
  recompLines.some((line) => line.includes("Белок 1,9 г/кг")),
  true,
  "protein per kg",
);
assertEqual(
  recompLines.some((line) => line.includes("К весу тела")),
  true,
  "relative strength",
);
assertEqual(
  recompLines.some((line) => line.includes("Присед +4%, к весу +6%")),
  true,
  "lift relative vs bar",
);

const seedBrief = buildReviewBrief({
  range: 14,
  from: "2026-09-01",
  to: "2026-09-14",
  days: [
    day({ date: "2026-09-05", protein: 162, targetProtein: 162, weight: 81 }),
  ],
  sessions: [],
  foods: [],
  macro: {
    macro: null,
    phase: null,
    phases: [],
    maxes: [],
    phase_circle: null,
    last_recap: null,
  },
  progress: {
    exercises: [
      {
        exercise_id: "e1",
        name: "Присед",
        category: "base",
        current_weight: 175,
        start_weight: 175,
        delta: 0,
        percent: 0,
        current_relative: 2.16,
        start_relative: 2.08,
        relative_percent: 3.8,
        points: [],
        from_work: true,
      },
    ],
    grown_count: 0,
    avg_percent: 0,
    avg_relative_percent: 3.8,
  },
  seedWeight: 84,
});

assertEqual(seedBrief.nutrition.weight.logged, 1, "one log in window");
assertEqual(seedBrief.nutrition.weight.start, 84, "seed is start");
assertEqual(seedBrief.nutrition.weight.end, 81, "log is end");
assertEqual(seedBrief.nutrition.weight.delta, -3, "delta uses seed");
assertEqual(
  seedBrief.signals.some((line) => line.includes("84 → 81")),
  true,
  "signal uses seed trend",
);
assertEqual(seedBrief.maxes.since, "first_work", "maxes since first work");
assertEqual(seedBrief.maxes.grown, 1, "relative counts in grown");
assertEqual(
  seedBrief.maxes.grown_list[0]?.name,
  "Присед",
  "relative counts as grown",
);
assertEqual(seedBrief.maxes.grown_list[0]?.start, 175, "start kg on max row");
assertEqual(
  seedBrief.maxes.grown_list[0]?.current_relative,
  2.16,
  "relative on max row",
);
assertEqual(
  seedBrief.signals.some((line) =>
    line.includes("Присед к весу +3,8% (2,08× → 2,16×)"),
  ),
  true,
  "relative-only lift",
);

const prompt = reviewPromptPayload(seedBrief);
assertEqual("days" in prompt.nutrition, false, "prompt drops days");
assertEqual("sessions" in prompt.gym, false, "prompt drops sessions");
assertEqual(prompt.nutrition.weight.delta, -3, "prompt keeps weight");
assertEqual(prompt.maxes.since, "first_work", "prompt labels maxes window");
assertEqual(prompt.maxes.grown_list[0]?.current, 175, "prompt keeps kg");
assertEqual(prompt.gym.notes.length, 0, "prompt keeps notes field");
assertEqual(prompt.gym.feels.easy, 0, "prompt keeps feels");
assertEqual(
  prompt.signals.some((line) => line.includes("84 → 81")),
  true,
  "prompt keeps signals",
);

console.log("ai signals ok");
