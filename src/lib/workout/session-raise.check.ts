import { increaseMax } from "@/lib/workout/formulas";
import {
  proposeMaxFromWorkSets,
  proposeSessionMaxRaises,
  raiseMaxConfirmMessage,
} from "@/lib/workout/session-raise";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const work = {
  set_type: "work",
  planned_weight: 80,
  actual_weight: 85,
};

assertEqual(
  proposeMaxFromWorkSets({
    sessionMax: 100,
    step: 2.5,
    sets: [work],
  }),
  105,
  "fact 85 from 80% of 100 floors to 105",
);

assertEqual(
  proposeMaxFromWorkSets({
    sessionMax: 100,
    step: 2.5,
    sets: [{ ...work, actual_weight: 80 }],
  }),
  null,
  "at plan is not a raise from fact",
);

assertEqual(
  proposeMaxFromWorkSets({
    sessionMax: 100,
    step: 2.5,
    sets: [{ set_type: "warmup", planned_weight: 60, actual_weight: 80 }],
  }),
  null,
  "warmup does not raise",
);

const exercises = [
  {
    exercise_id: "squat",
    name: "Присед",
    max_weight: 100,
    weight_step: 2.5,
    sets: [{ ...work, set_type: "work" as const }],
  },
];

assertEqual(
  proposeSessionMaxRaises({
    inCycle: true,
    feel: "easy",
    increasePercent: 5,
    currentMaxByExercise: new Map([["squat", 100]]),
    exercises,
  }),
  [],
  "cycle does not take session raises",
);

assertEqual(
  proposeSessionMaxRaises({
    inCycle: false,
    feel: "miss",
    increasePercent: 5,
    currentMaxByExercise: new Map([["squat", 100]]),
    exercises,
  }),
  [],
  "miss blocks raise",
);

assertEqual(
  proposeSessionMaxRaises({
    inCycle: false,
    feel: null,
    increasePercent: 5,
    currentMaxByExercise: new Map([["squat", 100]]),
    exercises,
  }),
  [{ exercise_id: "squat", name: "Присед", from_weight: 100, to_weight: 105 }],
  "fact above plan raises without feel",
);

assertEqual(
  proposeSessionMaxRaises({
    inCycle: false,
    feel: "easy",
    increasePercent: 5,
    currentMaxByExercise: new Map([["squat", 100]]),
    exercises: [
      {
        ...exercises[0],
        sets: [{ ...work, actual_weight: 80 }],
      },
    ],
  }),
  [
    {
      exercise_id: "squat",
      name: "Присед",
      from_weight: 100,
      to_weight: increaseMax(100, 5, 2.5),
    },
  ],
  "easy at plan uses increase percent",
);

assertEqual(
  proposeSessionMaxRaises({
    inCycle: false,
    feel: "close",
    increasePercent: 5,
    currentMaxByExercise: new Map([["squat", 105]]),
    exercises,
  }),
  [],
  "already raised current max is skipped",
);

assertEqual(
  raiseMaxConfirmMessage([
    { exercise_id: "squat", name: "Присед", from_weight: 100, to_weight: 105 },
  ]),
  "Поднять рабочий: Присед 100 → 105 кг?",
  "one offer confirm",
);

assertEqual(
  raiseMaxConfirmMessage([
    { exercise_id: "squat", name: "Присед", from_weight: 100, to_weight: 105 },
    { exercise_id: "bench", name: "Жим", from_weight: 80, to_weight: 82.5 },
  ]),
  "Поднять рабочие: Присед 100 → 105, Жим 80 → 82.5?",
  "several offers confirm",
);

console.log("session raise ok");
