import {
  phaseOpenedItself,
  pickSessionBeat,
  recordLine,
  sessionClosedCircle,
  sessionDetailBeat,
} from "@/lib/workout/beats";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const squat = {
  exerciseId: "sq",
  name: "Приседания со штангой",
  shortName: "присед",
  weight: 140,
  priorPeak: 130 as number | null | undefined,
};

assertEqual(
  pickSessionBeat([squat], 80)?.line,
  recordLine("Присед"),
  "heavier bar",
);
assertEqual(
  pickSessionBeat([{ ...squat, weight: 125, priorPeak: 110 }], 80)?.line,
  "Присед. Полтора.",
  "a new threshold beats a plain record",
);
assertEqual(
  pickSessionBeat([{ ...squat, weight: 130 }], 80),
  null,
  "same bar is not a record",
);
assertEqual(
  pickSessionBeat([{ ...squat, priorPeak: null, weight: 60 }], 80),
  null,
  "first point below bodyweight stays quiet",
);
assertEqual(
  pickSessionBeat([{ ...squat, priorPeak: null, weight: 100 }], 80)?.line,
  "Присед. Свой вес.",
  "first time at bodyweight still counts",
);
assertEqual(
  pickSessionBeat([{ ...squat, priorPeak: undefined }], 80),
  null,
  "unknown history stays quiet",
);
assertEqual(
  pickSessionBeat(
    [
      { ...squat, weight: 135, priorPeak: 130 },
      {
        exerciseId: "bp",
        name: "Жим лёжа",
        shortName: "жим лёжа",
        weight: 100,
        priorPeak: 80,
      },
    ],
    null,
  )?.name,
  "Жим лёжа",
  "bigger jump wins",
);

assertEqual(
  pickSessionBeat(
    [
      {
        exerciseId: "bp",
        name: "Жим лёжа",
        shortName: "жим лёжа",
        weight: 82,
        priorPeak: 70,
      },
    ],
    80,
  )?.line,
  "Жим лёжа. Свой вес.",
  "bench crosses bodyweight",
);
assertEqual(
  pickSessionBeat(
    [
      {
        exerciseId: "bp",
        name: "Жим лёжа",
        shortName: "жим лёжа",
        weight: 90,
        priorPeak: 85,
      },
    ],
    80,
  )?.line,
  recordLine("Жим лёжа"),
  "already over bodyweight is just a record",
);
assertEqual(
  pickSessionBeat(
    [
      {
        exerciseId: "dl",
        name: "Становая тяга",
        shortName: "становая",
        weight: 120,
        priorPeak: null,
      },
    ],
    100,
  )?.line,
  "Становая. Свой вес.",
  "first deadlift can cross",
);
assertEqual(
  pickSessionBeat([{ ...squat, weight: 120, priorPeak: 110 }], 80)?.line,
  "Присед. Полтора.",
  "squat 1.5× beats own weight",
);
assertEqual(
  pickSessionBeat([{ ...squat, weight: 90, priorPeak: 70 }], 80)?.line,
  "Присед. Свой вес.",
  "squat own weight before 1.5×",
);
assertEqual(
  pickSessionBeat([{ ...squat, weight: 90, priorPeak: 70 }], null)?.line,
  recordLine("Присед"),
  "no body weight still keeps the record",
);
assertEqual(
  pickSessionBeat(
    [
      {
        exerciseId: "row",
        name: "Тяга штанги в наклоне",
        shortName: "тяга в наклоне",
        weight: 100,
        priorPeak: 40,
      },
    ],
    80,
  )?.kind,
  "record",
  "other lifts stay a record",
);

assertEqual(
  sessionDetailBeat({
    beats: null,
    exercises: [
      {
        exercise_id: "sq",
        exercise: { name: squat.name, short_name: "присед" },
        sets: [
          {
            set_type: "work",
            planned_weight: 140,
            actual_weight: 140,
            planned_reps: 5,
            planned_reps_to: null,
            planned_seconds: null,
            planned_rir: null,
            actual_reps: 5,
            actual_seconds: null,
            actual_rir: null,
            id: "1",
            user_id: "u",
            session_exercise_id: "se",
            set_number: 1,
            is_completed: true,
            logged: true,
            created_at: "",
          },
        ],
      },
    ],
  }),
  null,
  "unloaded beats stay quiet",
);

assertEqual(
  phaseOpenedItself({
    autoEnd: true,
    completedCount: 0,
    circleSize: 3,
    previousCount: 3,
    previousLast: false,
    previousIncreases: false,
  }),
  true,
  "a finished week opened the next one",
);
assertEqual(
  phaseOpenedItself({
    autoEnd: false,
    completedCount: 0,
    circleSize: 3,
    previousCount: 3,
    previousLast: false,
    previousIncreases: false,
  }),
  false,
  "manual weeks stay on the close screen",
);
assertEqual(
  phaseOpenedItself({
    autoEnd: true,
    completedCount: 0,
    circleSize: 3,
    previousCount: 2,
    previousLast: false,
    previousIncreases: false,
  }),
  false,
  "an early close is not a finished circle",
);
assertEqual(
  phaseOpenedItself({
    autoEnd: true,
    completedCount: 1,
    circleSize: 3,
    previousCount: 3,
    previousLast: false,
    previousIncreases: false,
  }),
  false,
  "the new week already started",
);
assertEqual(
  phaseOpenedItself({
    autoEnd: true,
    completedCount: 0,
    circleSize: 3,
    previousCount: 3,
    previousLast: true,
    previousIncreases: false,
  }),
  false,
  "the last week waits for a tap",
);
assertEqual(
  phaseOpenedItself({
    autoEnd: true,
    completedCount: 0,
    circleSize: 3,
    previousCount: 3,
    previousLast: false,
    previousIncreases: true,
  }),
  false,
  "a max bump waits for a look",
);
assertEqual(
  sessionClosedCircle({
    sessionDate: "2026-09-29",
    today: "2026-09-29",
    sessionPhaseId: "old",
    currentPhaseId: "new",
    openedItself: true,
  }),
  true,
  "today's session closed the circle",
);
assertEqual(
  sessionClosedCircle({
    sessionDate: "2026-09-20",
    today: "2026-09-29",
    sessionPhaseId: "old",
    currentPhaseId: "new",
    openedItself: true,
  }),
  false,
  "an older session does not claim the close",
);

console.log("beats ok");
