import {
  cycleCanDeload,
  easedPlanningMax,
  easeWeekConfirm,
  easeWeekKind,
  easeWeekMessage,
  threeMisses,
} from "@/lib/workout/ease-week";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(threeMisses(["miss", "miss"]), false, "two misses are not a week");
assertEqual(
  threeMisses(["miss", "miss", "miss"]),
  true,
  "three misses in a row",
);
assertEqual(
  threeMisses(["miss", "close", "miss", "miss"]),
  false,
  "a close breaks the row",
);
assertEqual(
  threeMisses(["easy", "miss", "miss", "miss"]),
  true,
  "only the last three count",
);

assertEqual(
  easeWeekKind({
    feels: ["miss", "miss", "miss"],
    eased: false,
    inCycle: true,
    canDeload: true,
  }),
  "deload",
  "a cycle opens the light week",
);
assertEqual(
  easeWeekKind({
    feels: ["miss", "miss", "miss"],
    eased: false,
    inCycle: true,
    canDeload: false,
  }),
  null,
  "no light week in this cycle",
);
assertEqual(
  easeWeekKind({
    feels: ["miss", "miss", "miss"],
    eased: true,
    inCycle: true,
    canDeload: true,
  }),
  null,
  "already eased",
);
assertEqual(
  easeWeekKind({
    feels: ["miss", "miss", "miss"],
    eased: false,
    inCycle: false,
    canDeload: false,
  }),
  "lighter",
  "without a cycle the bar drops a step",
);

assertEqual(
  cycleCanDeload({
    cycle: [],
    phaseType: "volume",
    deloadTaken: false,
  }),
  true,
  "the built-in cycle has a light week",
);
assertEqual(
  cycleCanDeload({
    cycle: [{ key: "volume" }],
    phaseType: "volume",
    deloadTaken: false,
  }),
  false,
  "a custom cycle without a light week",
);
assertEqual(
  cycleCanDeload({
    cycle: [],
    phaseType: "deload",
    deloadTaken: false,
  }),
  false,
  "already on the light week",
);
assertEqual(
  cycleCanDeload({
    cycle: [{ key: "deload" }],
    phaseType: "peak",
    deloadTaken: true,
  }),
  false,
  "the light week already happened",
);

assertEqual(easedPlanningMax(80, 2.5), 77.5, "one step down");
assertEqual(easedPlanningMax(82.5, 2.5), 80, "lands on the plate grid");
assertEqual(easedPlanningMax(2.5, 2.5), null, "does not zero the bar");
assertEqual(
  easeWeekMessage("deload").includes("лёгкую неделю"),
  true,
  "deload copy",
);
assertEqual(
  easeWeekConfirm("lighter"),
  "Снизить рабочий вес на шаг?",
  "lighter confirm",
);

console.log("ease week ok");
