import { shiftIsoDate } from "@/lib/day/dates";
import {
  energyGoalLine,
  energyGoalOffer,
  energyGoalPayload,
} from "@/lib/nutrition/energy-goal";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function days(input: {
  from: string;
  count: number;
  kcal: number;
  weights?: Record<string, number>;
}) {
  const rows = [];
  let date = input.from;
  for (let index = 0; index < input.count; index += 1) {
    rows.push({
      date,
      fact_kcal: input.kcal,
      target_kcal: 2200,
      body_weight: input.weights?.[date] ?? null,
    });
    date = shiftIsoDate(date, 1);
  }
  return rows;
}

const twoWeeks = days({
  from: "2026-09-01",
  count: 15,
  kcal: 2400,
  weights: { "2026-09-01": 80, "2026-09-15": 80 },
});

const macros = {
  restProtein: 150,
  restFat: 70,
  restCarbs: 250,
  trainingProtein: 150,
  trainingFat: 70,
  dismissedKcal: null,
};

const lose = energyGoalOffer({
  days: twoWeeks,
  goal: "lose",
  ...macros,
});
assertEqual(lose?.expenditure, 2400, "flat scale burn is the plate");
assertEqual(lose?.restKcal, 2010, "cut is about 400 under the burn");
assertEqual(lose?.restCarbs, 195, "carbs fill the cut");
assertEqual(lose?.trainingCarbs, 245, "training keeps the extra 50 g");
assert(lose != null, "lose offer");
if (lose) {
  assertEqual(
    energyGoalLine(lose),
    "Расход около 2400. На сушку цель 2010.",
    "cut line",
  );
  const payload = energyGoalPayload(lose);
  assert(payload != null, "payload");
  if (payload) {
    assertEqual(payload.goal, "lose", "payload keeps the goal");
    assertEqual(
      "restCarbs" in payload,
      false,
      "payload leaves carbs on the server",
    );
  }
}

const keep = energyGoalOffer({
  days: twoWeeks,
  goal: "keep",
  ...macros,
});
assertEqual(keep?.restKcal, 2410, "keep matches the burn after carb rounding");
assert(keep != null, "keep offer");
if (keep) {
  assertEqual(
    energyGoalLine(keep),
    "Расход около 2400. Держать около 2410.",
    "keep line",
  );
}

const gain = energyGoalOffer({
  days: twoWeeks,
  goal: "gain",
  ...macros,
});
assertEqual(gain?.restKcal, 2650, "gain is 250 above the burn");
assert(gain != null, "gain offer");
if (gain) {
  assertEqual(
    energyGoalLine(gain),
    "Расход около 2400. На набор цель 2650.",
    "gain line",
  );
}

assertEqual(
  energyGoalOffer({
    days: twoWeeks,
    goal: null,
    ...macros,
  }),
  null,
  "no goal, no offer",
);

assertEqual(
  energyGoalOffer({
    days: days({
      from: "2026-09-01",
      count: 8,
      kcal: 2400,
      weights: { "2026-09-01": 80, "2026-09-08": 80 },
    }),
    goal: "lose",
    ...macros,
  }),
  null,
  "one week is too short to move the goal",
);

assertEqual(
  energyGoalOffer({
    days: twoWeeks,
    goal: "keep",
    ...macros,
    restCarbs: 295,
  }),
  null,
  "already on the suggested goal",
);

assertEqual(
  energyGoalOffer({
    days: twoWeeks,
    goal: "lose",
    ...macros,
    dismissedKcal: 2010,
  }),
  null,
  "the same cut stays dismissed",
);

assert(
  energyGoalOffer({
    days: twoWeeks,
    goal: "lose",
    ...macros,
    dismissedKcal: 1800,
  }) != null,
  "a moved cut shows again",
);

console.log("energy goal offer ok");
