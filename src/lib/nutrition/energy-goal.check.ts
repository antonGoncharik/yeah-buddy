import { shiftIsoDate } from "@/lib/day/dates";
import {
  energyGoalHint,
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
  weights: {
    "2026-09-01": 80,
    "2026-09-08": 80,
    "2026-09-15": 80,
  },
});

const macros = {
  sex: null,
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
assertEqual(
  lose?.restKcal,
  1970,
  "cut is about half a percent a week under the burn",
);
assertEqual(lose?.rest.protein, 160, "protein follows 2 g/kg at 80 kg");
assertEqual(lose?.restCarbs, 175, "carbs fill the cut after protein");
assertEqual(lose?.trainingCarbs, 225, "training keeps the extra 50 g");
assertEqual(lose?.rest.fat, 70, "fat stays while carbs can move");
assert(lose != null, "lose offer");
if (lose) {
  assertEqual(
    energyGoalLine(lose),
    "Вес стоит. Расход около 2400. На сушку цель 1970.",
    "cut line",
  );
  const payload = energyGoalPayload(lose);
  assert(payload != null, "payload");
  if (payload) {
    assertEqual(payload.goal, "lose", "payload keeps the goal");
    assertEqual(payload.delta, 0, "payload keeps the scale");
    assertEqual(payload.span, 14, "payload keeps the window");
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
    "Вес стоит. Расход около 2400. Держать около 2410.",
    "keep line",
  );
}

const gain = energyGoalOffer({
  days: twoWeeks,
  goal: "gain",
  ...macros,
});
assertEqual(
  gain?.restKcal,
  2590,
  "gain is about a quarter percent a week above the burn",
);
assert(gain != null, "gain offer");
if (gain) {
  assertEqual(
    energyGoalLine(gain),
    "Вес стоит. Расход около 2400. На набор цель 2590.",
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

const falling = energyGoalOffer({
  days: days({
    from: "2026-09-01",
    count: 15,
    kcal: 2400,
    weights: {
      "2026-09-01": 80,
      "2026-09-08": 79.65,
      "2026-09-15": 79.3,
    },
  }),
  goal: "lose",
  ...macros,
});
assertEqual(falling?.delta, -0.7, "the offer uses the scale trend");
assertEqual(
  falling?.restKcal,
  2350,
  "a real loss does not cut another blind 400",
);
assert(falling != null, "falling offer");
if (falling) {
  assertEqual(
    energyGoalLine(falling),
    "Вес −0.7 кг за 14 дней. Расход около 2790. На сушку цель 2350.",
    "falling line names the scale",
  );
}

const tooFast = energyGoalOffer({
  days: days({
    from: "2026-09-01",
    count: 15,
    kcal: 1800,
    weights: {
      "2026-09-01": 80,
      "2026-09-08": 79.3,
      "2026-09-15": 78.6,
    },
  }),
  goal: "lose",
  ...macros,
  restCarbs: 80,
});
assertEqual(
  tooFast?.restKcal,
  1910,
  "a fast cut raises the goal toward the right rate, capped per week",
);
assert(
  (tooFast?.restKcal ?? 0) > 160 * 4 + 70 * 9 + 80 * 4,
  "the new goal is more food than the current plate target",
);

const patchy = days({
  from: "2026-09-01",
  count: 15,
  kcal: 2400,
  weights: {
    "2026-09-01": 80,
    "2026-09-08": 80,
    "2026-09-15": 80,
  },
}).map((row, index) => (index < 3 ? { ...row, fact_kcal: 0 } : row));
assertEqual(
  energyGoalOffer({
    days: patchy,
    goal: "lose",
    ...macros,
  }),
  null,
  "a patchy log does not move a small cut",
);
assert(
  energyGoalOffer({
    days: patchy,
    goal: "lose",
    ...macros,
    restCarbs: 400,
  }) != null,
  "a patchy log still moves a goal that is far off, part of the way",
);

const stuck = energyGoalOffer({
  days: days({
    from: "2026-09-01",
    count: 15,
    kcal: 2000,
    weights: {
      "2026-09-01": 70,
      "2026-09-08": 70,
      "2026-09-15": 70,
    },
  }),
  goal: "lose",
  ...macros,
  restProtein: 200,
  restFat: 90,
  trainingProtein: 200,
  trainingFat: 90,
  restCarbs: 80,
});
assert(
  stuck != null && stuck.rest.fat < 90,
  "fat steps down when carbs are on the floor",
);
assertEqual(
  stuck?.training.fat,
  stuck?.rest.fat,
  "training fat steps down with the rest day",
);

assertEqual(
  energyGoalOffer({
    days: days({
      from: "2026-09-01",
      count: 15,
      kcal: 2400,
      weights: {
        "2026-09-01": 80,
        "2026-09-08": 80,
        "2026-09-15": 80,
      },
    }).map((row, index) =>
      index >= 8 && index <= 12 ? { ...row, fact_kcal: 0 } : row,
    ),
    goal: "lose",
    ...macros,
  }),
  null,
  "a stale log with holes this week does not move the goal",
);

assertEqual(
  energyGoalHint({
    days: days({
      from: "2026-09-01",
      count: 12,
      kcal: 2200,
      weights: { "2026-09-01": 80 },
    }),
    goal: "keep",
    ...macros,
    accountAgeDays: 14,
  }),
  "Взвешивайся раз в неделю — по еде и весу посчитаем расход и предложим калории.",
  "hint asks for weigh-ins",
);

assertEqual(
  energyGoalHint({
    days: twoWeeks,
    goal: "keep",
    ...macros,
    accountAgeDays: 3,
  }),
  null,
  "first week stays quiet",
);

assertEqual(
  energyGoalHint({
    days: twoWeeks,
    goal: "keep",
    ...macros,
    dismissedKcal: lose?.restKcal ?? 0,
    accountAgeDays: 20,
  }),
  null,
  "dismissed offer does not nag",
);

console.log("energy goal offer ok");
