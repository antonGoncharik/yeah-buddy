import {
  addSidePlate,
  BAR_KG,
  canMakeTarget,
  loadedKg,
  loadStatus,
  plateLabel,
  REST_LOAD_OVER_LINE,
  resolveLoadTarget,
  restLoadHitLine,
  restLoadLine,
  restLoadTargetKg,
  undoSidePlate,
  workLoadKg,
} from "@/lib/workout/rest-load";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

assertEqual(BAR_KG, 20, "olympic bar");
assertEqual(canMakeTarget(80), true, "80 is a bar load");
assertEqual(canMakeTarget(82.5), true, "82.5 needs 1.25");
assertEqual(canMakeTarget(22.5), true, "smallest plate pair");
assertEqual(canMakeTarget(20), false, "empty bar is not a puzzle");
assertEqual(canMakeTarget(12), false, "dumbbell is not a bar");
assertEqual(canMakeTarget(21), false, "odd kilo");
assertEqual(loadedKg([]), 20, "bar only");
assertEqual(loadedKg([25]), 70, "25 each side");
assertEqual(loadedKg([25, 5]), 80, "25 and 5");
assertEqual(loadedKg([25, 2.5, 1.25]), 77.5, "quarters");
assertEqual(addSidePlate([25], 5), [25, 5], "add plate");
assertEqual(undoSidePlate([25, 5]), [25], "undo last");
assertEqual(undoSidePlate([]), [], "undo empty");
assertEqual(loadStatus(20, 80), "empty", "just the bar");
assertEqual(loadStatus(70, 80), "under", "still short");
assertEqual(loadStatus(80, 80), "hit", "exact");
assertEqual(loadStatus(90, 80), "over", "too much");
assertEqual(plateLabel(25), "25", "whole plate");
assertEqual(plateLabel(2.5), "2.5", "half");
assertEqual(plateLabel(1.25), "1.25", "quarter");
assertEqual(plateLabel(77.5), "77.5", "loaded total");
assertEqual(
  workLoadKg([
    {
      set_type: "warmup",
      planned_weight: 40,
      actual_weight: null,
    },
    {
      set_type: "work",
      planned_weight: 70,
      actual_weight: null,
    },
    {
      set_type: "work",
      planned_weight: 80,
      actual_weight: null,
    },
  ]),
  80,
  "last work set",
);
assertEqual(
  workLoadKg([
    {
      set_type: "work",
      planned_weight: 80,
      actual_weight: 85,
    },
  ]),
  85,
  "actual beats plan",
);
assertEqual(resolveLoadTarget(80, "ex"), 80, "keeps a real load");
assertEqual(
  resolveLoadTarget(12, "a"),
  resolveLoadTarget(12, "a"),
  "stable fallback",
);
assertEqual(
  [60, 80, 100, 120].includes(resolveLoadTarget(null, null)),
  true,
  "fallback is a gym number",
);
assertEqual(
  restLoadTargetKg(
    [
      {
        exercise_id: "ex-1",
        sets: [
          {
            set_type: "work",
            planned_weight: 87.5,
            actual_weight: null,
          },
        ],
      },
    ],
    "ex-1",
  ),
  87.5,
  "session work weight",
);
assertEqual(restLoadHitLine(100), "Сотня. Круглая.", "hundred");
assertEqual(restLoadHitLine(40), "Лёгкий вес.", "light bar");
assertEqual(restLoadHitLine(80), "Встало.", "working hit");
assertEqual(restLoadLine(20, 80), "20 / 80 кг", "progress");
assertEqual(restLoadLine(80, 80), "Встало.", "hit line");
assertEqual(restLoadLine(90, 80), REST_LOAD_OVER_LINE, "over line");

console.log("rest load ok");
