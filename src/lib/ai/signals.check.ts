import { buildReviewBrief } from "@/lib/ai/brief";
import { compactWaist } from "@/lib/ai/compact-nutrition";
import {
  reviewCoverage,
  reviewCtaReady,
  reviewOfferReady,
} from "@/lib/ai/coverage";
import { formatG } from "@/lib/ai/format";
import { REVIEW_SYSTEM_PROMPT, reviewPromptPayload } from "@/lib/ai/prompt";
import { buildSignals, reviewDetailSignals } from "@/lib/ai/signal-lines";
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
    category: input.category ?? null,
    percent: input.percent ?? null,
    relative_percent: input.relative_percent ?? null,
    delta: input.delta ?? null,
    start: input.start ?? null,
    current: input.current ?? null,
    start_relative: input.start_relative ?? null,
    current_relative: input.current_relative ?? null,
    tonnage_percent: input.tonnage_percent ?? null,
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
  waist?: number | null;
}): DayHistoryRow {
  return {
    date: input.date,
    is_training_day: input.training ?? false,
    target_protein: input.targetProtein,
    target_fat: 70,
    target_carbs: input.targetCarbs ?? 130,
    target_kcal: input.targetKcal ?? 2000,
    body_weight: input.weight ?? null,
    waist_cm: input.waist ?? null,
    caught_up: false,
    fact_protein: input.protein,
    fact_fat: 70,
    fact_carbs: input.carbs ?? 130,
    fact_kcal: input.kcal ?? 2000,
  };
}

assertEqual(reviewCoverage(0, 0), "empty", "empty log");
assertEqual(reviewCoverage(2, 1), "thin", "thin log");
assertEqual(reviewCoverage(6, 3), "thin", "thin still");
assertEqual(reviewCoverage(7, 1), "ok", "enough days");
assertEqual(reviewCoverage(3, 3), "thin", "three gyms still thin");
assertEqual(reviewCoverage(3, 4), "ok", "enough gym");
assertEqual(reviewOfferReady(7, 0), true, "seven food days");
assertEqual(reviewOfferReady(0, 4), true, "four gyms");
assertEqual(reviewOfferReady(6, 3), false, "not yet");
assertEqual(
  reviewCtaReady({ loggedDays: 7, completedWorkouts: 0, ageDays: 7 }),
  true,
  "week lived and seven food days",
);
assertEqual(
  reviewCtaReady({ loggedDays: 0, completedWorkouts: 4, ageDays: 4 }),
  false,
  "four gyms before a week stay quiet",
);
assertEqual(
  reviewCtaReady({ loggedDays: 7, completedWorkouts: 0, ageDays: null }),
  false,
  "unknown age does not open review",
);

const proteinDays = [
  day({ date: "2026-09-01", protein: 150, targetProtein: 200 }),
  day({ date: "2026-09-02", protein: 210, targetProtein: 200 }),
  day({ date: "2026-09-03", protein: 120, targetProtein: 200, training: true }),
];

const lines = buildSignals({
  days: proteinDays,
  rest: {
    count: 2,
    fact: { protein: 180, fat: 50, carbs: 130, kcal: 2000 },
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
    feels: { easy: 2, close: 0, miss: 0 },
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
    planned_cycle: [
      { key: "ramp", name: "Разгон" },
      { key: "volume", name: "Набор" },
      { key: "peak", name: "Рывок" },
      { key: "deload", name: "Сброс" },
    ],
    phase_circle: {
      phase_type: "volume",
      phase_name: "Набор",
      next_phase_type: "peak",
      next_phase_name: "Рывок",
      last_in_cycle: false,
      increases_on_end: true,
      kg_increase_on_end: null,
      hold_weights: false,
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
  lines.some((line) => line.includes("На отдыхе жира не хватало на 20 г")),
  true,
  "rest fat",
);
assertEqual(
  lines.some((line) => line.includes("Легко 2, без роста: Молот")),
  true,
  "easy but stalled",
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
    line.includes(
      "Отдых · 2: 2000/2000 ккал, белок 180/200 г, жир 50/70 г, углеводы 130/130 г.",
    ),
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
    planned_cycle: [],
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
  recompLines.some((line) => line.includes("можно поднять максимум")),
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

const details = reviewDetailSignals(lines);
assertEqual(
  details.some((line) => line.startsWith("Белок дотянули:")),
  false,
  "detail drops protein hit",
);
assertEqual(
  details.some((line) => line.startsWith("Зал:")),
  false,
  "detail drops gym count",
);
assertEqual(
  details.some((line) => line.includes("углеводов не хватало")),
  true,
  "detail keeps carbs miss",
);
assertEqual(
  details.some((line) => line.includes("Топ белка")),
  true,
  "detail keeps foods",
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
    planned_cycle: [],
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
        current_tonnage: null,
        start_tonnage: null,
        tonnage_delta: null,
        tonnage_percent: null,
        points: [
          {
            date: "2026-08-20",
            weight: 175,
            seconds: null,
            tonnage: null,
            circle_tonnage: null,
            body_weight: 84,
            relative: 2.08,
            phase_type: null,
            macro_number: null,
            label: "2026-08-20",
          },
          {
            date: "2026-09-10",
            weight: 175,
            seconds: null,
            tonnage: null,
            circle_tonnage: null,
            body_weight: 81,
            relative: 2.16,
            phase_type: null,
            macro_number: null,
            label: "2026-09-10",
          },
        ],
        from_work: true,
      },
    ],
    grown_count: 0,
    avg_percent: 0,
    avg_relative_percent: 3.8,
    weights: [],
    circle_size: 0,
    sessions: [],
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
assertEqual(seedBrief.maxes.since, "window", "maxes since window");
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
assertEqual(seedBrief.nutrition.days[0]?.fat, 70, "day keeps fat");
assertEqual(seedBrief.nutrition.halves, null, "one day has no halves");
assertEqual(
  seedBrief.maxes.grown_list[0]?.category,
  "База",
  "max row category",
);
assertEqual(
  seedBrief.signals.some((line) => line.includes("записана 1 из 14")),
  true,
  "food log coverage",
);

const prompt = reviewPromptPayload(seedBrief);
assertEqual(prompt.nutrition.days.length, 1, "prompt keeps days");
assertEqual(prompt.nutrition.days[0]?.fat, 70, "prompt keeps day fat");
assertEqual(prompt.nutrition.halves, null, "prompt keeps halves");
assertEqual(Array.isArray(prompt.gym.sessions), true, "prompt keeps sessions");
assertEqual(prompt.nutrition.weight.delta, -3, "prompt keeps weight");
assertEqual(prompt.maxes.since, "window", "prompt labels maxes window");
assertEqual(prompt.maxes.grown_list[0]?.current, 175, "prompt keeps kg");
assertEqual(prompt.gym.notes.length, 0, "prompt keeps notes field");
assertEqual(prompt.gym.feels.easy, 0, "prompt keeps feels");
assertEqual(prompt.previous, null, "prompt previous empty");
assertEqual(
  prompt.signals.some((line) => line.includes("84 → 81")),
  true,
  "prompt keeps signals",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("Не копируй табло"),
  true,
  "prompt forbids scoreboard copy",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("Хорошо:"),
  true,
  "prompt shows a good observation",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("90 дней"),
  true,
  "prompt knows the quarter window",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("хороший друг"),
  true,
  "prompt asks for a friend voice",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("короткий совет"),
  true,
  "prompt asks for grounded advice",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("3–5 предложений"),
  true,
  "prompt asks for longer observations",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("Назови упражнения"),
  true,
  "prompt asks to name lifts",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("8–12 связных абзацев"),
  true,
  "prompt asks for a full window",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("Когда совет заходит"),
  true,
  "prompt requires advice",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("start_relative"),
  true,
  "prompt reads relative bar",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("last_recap"),
  true,
  "prompt reads last cycle",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("одно предложение"),
  true,
  "prompt wants a one-breath headline",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("sessions[].work"),
  true,
  "prompt reads the working sets",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("tonnage_percent"),
  true,
  "prompt reads lift volume",
);
assertEqual(seedBrief.gym.records.length, 0, "same bar is not a PR");
assertEqual(seedBrief.gym.tonnage, null, "no work tonnage");
assertEqual(seedBrief.gym.gap_days, null, "one gymless day is not a hole");
assertEqual(prompt.gym.circle_size, 0, "prompt keeps circle size");
assertEqual(prompt.gym.gap_days, null, "prompt keeps gym gap");
assertEqual(seedBrief.nutrition.waist, null, "no waist stays empty");
assertEqual(
  seedBrief.nutrition.foods_training.length,
  0,
  "food split stays empty",
);
assertEqual(seedBrief.sex, null, "sex stays empty");
assertEqual(seedBrief.goal, null, "goal stays empty");
assertEqual(seedBrief.training_age, null, "age stays empty");
assertEqual(prompt.sex, null, "prompt keeps sex");
assertEqual(prompt.goal, null, "prompt keeps goal");
assertEqual(prompt.training_age, null, "prompt keeps age");
assertEqual(
  buildReviewBrief({
    range: 14,
    from: "2026-09-01",
    to: "2026-09-14",
    days: [],
    sessions: [],
    foods: [],
    macro: {
      macro: null,
      phase: null,
      phases: [],
      maxes: [],
      planned_cycle: [],
      phase_circle: null,
      last_recap: null,
    },
    progress: {
      exercises: [],
      grown_count: 0,
      avg_percent: null,
      avg_relative_percent: null,
      weights: [],
      circle_size: 0,
      sessions: [],
    },
    sex: "female",
    goal: "lose",
    trainingAge: "years",
  }).sex,
  "женщина",
  "brief maps sex",
);
assertEqual(
  buildReviewBrief({
    range: 14,
    from: "2026-09-01",
    to: "2026-09-14",
    days: [],
    sessions: [],
    foods: [],
    macro: {
      macro: null,
      phase: null,
      phases: [],
      maxes: [],
      planned_cycle: [],
      phase_circle: null,
      last_recap: null,
    },
    progress: {
      exercises: [],
      grown_count: 0,
      avg_percent: null,
      avg_relative_percent: null,
      weights: [],
      circle_size: 0,
      sessions: [],
    },
    sex: "female",
    goal: "lose",
    trainingAge: "years",
  }).goal,
  "похудеть",
  "brief maps goal",
);
assertEqual(
  buildReviewBrief({
    range: 14,
    from: "2026-09-01",
    to: "2026-09-14",
    days: [],
    sessions: [],
    foods: [],
    macro: {
      macro: null,
      phase: null,
      phases: [],
      maxes: [],
      planned_cycle: [],
      phase_circle: null,
      last_recap: null,
    },
    progress: {
      exercises: [],
      grown_count: 0,
      avg_percent: null,
      avg_relative_percent: null,
      weights: [],
      circle_size: 0,
      sessions: [],
    },
    trainingAge: "years",
  }).training_age,
  "несколько лет",
  "brief maps years age",
);
assertEqual(
  buildReviewBrief({
    range: 14,
    from: "2026-09-01",
    to: "2026-09-14",
    days: [],
    sessions: [],
    foods: [],
    macro: {
      macro: null,
      phase: null,
      phases: [],
      maxes: [],
      planned_cycle: [],
      phase_circle: null,
      last_recap: null,
    },
    progress: {
      exercises: [],
      grown_count: 0,
      avg_percent: null,
      avg_relative_percent: null,
      weights: [],
      circle_size: 0,
      sessions: [],
    },
    sex: "male",
    goal: "gain",
    trainingAge: "beginner",
  }).goal,
  "набрать",
  "brief maps gain goal",
);
assertEqual(
  buildReviewBrief({
    range: 14,
    from: "2026-09-01",
    to: "2026-09-14",
    days: [],
    sessions: [],
    foods: [],
    macro: {
      macro: null,
      phase: null,
      phases: [],
      maxes: [],
      planned_cycle: [],
      phase_circle: null,
      last_recap: null,
    },
    progress: {
      exercises: [],
      grown_count: 0,
      avg_percent: null,
      avg_relative_percent: null,
      weights: [],
      circle_size: 0,
      sessions: [],
    },
    trainingAge: "beginner",
  }).training_age,
  "новичок",
  "brief maps beginner age",
);
assertEqual(
  prompt.nutrition.foods_training.length,
  0,
  "prompt keeps the training plate",
);
assertEqual(
  compactWaist(
    [day({ date: "2026-09-10", protein: 1, targetProtein: 1, waist: 82 })],
    84,
    "2026-09-01",
  )?.delta,
  -2,
  "waist delta from the previous measurement",
);
assertEqual(REVIEW_SYSTEM_PROMPT.includes("Талия"), true, "prompt reads waist");
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("foods_training"),
  true,
  "prompt reads the training plate",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("sex —"),
  true,
  "prompt reads sex",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("goal —"),
  true,
  "prompt reads goal",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("training_age"),
  true,
  "prompt reads training age",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("новичок"),
  true,
  "prompt names beginner age",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("похудеть"),
  true,
  "prompt names lose goal",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("женщина"),
  true,
  "prompt names female sex",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("training_years"),
  false,
  "prompt drops year count",
);
assertEqual(
  reviewPromptPayload(
    buildReviewBrief({
      range: 14,
      from: "2026-09-01",
      to: "2026-09-14",
      days: [],
      sessions: [],
      foods: [],
      macro: {
        macro: null,
        phase: null,
        phases: [],
        maxes: [],
        planned_cycle: [],
        phase_circle: null,
        last_recap: null,
      },
      progress: {
        exercises: [],
        grown_count: 0,
        avg_percent: null,
        avg_relative_percent: null,
        weights: [],
        circle_size: 0,
        sessions: [],
      },
      sex: "female",
      goal: "keep",
      trainingAge: "year",
    }),
  ).goal,
  "держать",
  "prompt keeps goal label",
);

console.log("ai signals ok");
