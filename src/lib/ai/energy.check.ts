import { buildReviewBrief } from "@/lib/ai/brief";
import {
  dynamicExpenditure,
  energySignalLine,
  KCAL_PER_BODY_KG,
} from "@/lib/ai/energy";
import { REVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { shiftIsoDate } from "@/lib/day/dates";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function days(input: {
  from: string;
  count: number;
  kcal: number;
  target?: number;
  weights?: Record<string, number>;
  eat?: (index: number) => boolean;
}) {
  const rows = [];
  let date = input.from;
  for (let index = 0; index < input.count; index += 1) {
    const eat = input.eat ? input.eat(index) : true;
    rows.push({
      date,
      fact_kcal: eat ? input.kcal : 0,
      target_kcal: input.target ?? 2200,
      body_weight: input.weights?.[date] ?? null,
    });
    date = shiftIsoDate(date, 1);
  }
  return rows;
}

const loss = dynamicExpenditure(
  days({
    from: "2026-09-01",
    count: 15,
    kcal: 2000,
    weights: { "2026-09-01": 80, "2026-09-15": 79.3 },
  }),
);
assertEqual(loss?.span, 14, "span is days between weigh-ins");
assertEqual(loss?.logged, 15, "every day in the stretch counts");
assertEqual(loss?.intake, 2000, "intake stays the plate");
assertEqual(loss?.target, 2200, "target stays the diary goal");
assertEqual(loss?.delta, -0.7, "scale delta");
assertEqual(
  loss?.kcal,
  Math.round((2000 - (-0.7 * KCAL_PER_BODY_KG) / 14) / 10) * 10,
  "loss raises the burn above the plate",
);
if (loss == null) {
  throw new Error("loss: expected a burn");
}
assertEqual(
  energySignalLine(loss),
  "Расход около 2390 ккал/день за 14 дней: съедено 2000, вес −0.7 кг. Цель этих дней 2200.",
  "loss line",
);

const gain = dynamicExpenditure(
  days({
    from: "2026-09-01",
    count: 15,
    kcal: 2500,
    weights: { "2026-09-01": 80, "2026-09-15": 80.5 },
  }),
);
assertEqual(gain?.delta, 0.5, "gain delta");
assertEqual(
  gain?.kcal,
  Math.round((2500 - (0.5 * KCAL_PER_BODY_KG) / 14) / 10) * 10,
  "gain lowers the burn under the plate",
);

const flat = dynamicExpenditure(
  days({
    from: "2026-09-01",
    count: 15,
    kcal: 2000,
    target: 0,
    weights: { "2026-09-01": 80, "2026-09-15": 80 },
  }),
);
assertEqual(flat?.kcal, 2000, "flat scale means burn equals the plate");
assertEqual(flat?.target, null, "zero targets stay empty");
if (flat == null) {
  throw new Error("flat: expected a burn");
}
assertEqual(
  energySignalLine(flat),
  "Расход около 2000 ккал/день за 14 дней: съедено 2000, вес стоит.",
  "flat line has no target",
);

assertEqual(
  dynamicExpenditure(
    days({
      from: "2026-09-01",
      count: 15,
      kcal: 2000,
      weights: { "2026-09-01": 80 },
    }),
  ),
  null,
  "one weigh-in is not a burn",
);
assertEqual(
  dynamicExpenditure(
    days({
      from: "2026-09-01",
      count: 7,
      kcal: 2000,
      weights: { "2026-09-01": 80, "2026-09-07": 79.5 },
    }),
  ),
  null,
  "under a week stays empty",
);
assertEqual(
  dynamicExpenditure(
    days({
      from: "2026-09-01",
      count: 15,
      kcal: 2000,
      weights: { "2026-09-01": 80, "2026-09-15": 79.3 },
      eat: (index) => index < 4,
    }),
  ),
  null,
  "thin food log stays empty",
);
assertEqual(
  dynamicExpenditure(
    days({
      from: "2026-09-01",
      count: 8,
      kcal: 2000,
      weights: { "2026-09-01": 80, "2026-09-08": 70 },
    }),
  ),
  null,
  "a wild swing is not a burn",
);

const emptyMacro = {
  macro: null,
  phase: null,
  phases: [],
  maxes: [],
  planned_cycle: [],
  phase_circle: null,
  last_recap: null,
};
const emptyProgress = {
  exercises: [],
  grown_count: 0,
  avg_percent: null,
  avg_relative_percent: null,
  weights: [],
  circle_size: 0,
  sessions: [],
};

assertEqual(
  buildReviewBrief({
    range: 14,
    from: "2026-09-01",
    to: "2026-09-15",
    days: [
      {
        date: "2026-09-15",
        is_training_day: false,
        target_protein: 160,
        target_fat: 70,
        target_carbs: 130,
        target_kcal: 2200,
        body_weight: 79.3,
        waist_cm: null,
        caught_up: false,
        fact_protein: 160,
        fact_fat: 70,
        fact_carbs: 130,
        fact_kcal: 2000,
      },
    ],
    sessions: [],
    foods: [],
    macro: emptyMacro,
    progress: emptyProgress,
    seedWeight: 84,
  }).nutrition.energy,
  null,
  "a weight from before the window is not a burn",
);

assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("nutrition.energy"),
  true,
  "prompt reads expenditure",
);
assertEqual(
  REVIEW_SYSTEM_PROMPT.includes("Нет energy"),
  true,
  "prompt refuses an invented burn",
);

console.log("ai energy ok");
