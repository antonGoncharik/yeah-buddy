import {
  easedWeightTenPercent,
  peakWorkWeight,
  shouldEaseTrackAfterHolds,
  trackProgressFromWorkSets,
} from "@/lib/workout/track-progress";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const work = (
  reps: number,
  actual: number,
  planned = 80,
  actualWeight = 80,
): {
  set_type: string;
  planned_weight: number;
  actual_weight: number;
  planned_reps: number;
  actual_reps: number;
  planned_reps_to: number | null;
} => ({
  set_type: "work",
  planned_weight: planned,
  actual_weight: actualWeight,
  planned_reps: reps,
  actual_reps: actual,
  planned_reps_to: null,
});

assertEqual(
  trackProgressFromWorkSets({ feel: "easy", sets: [work(5, 5)] }),
  "up",
  "5/5 up",
);

assertEqual(
  trackProgressFromWorkSets({ feel: "close", sets: [work(5, 3)] }),
  "hold",
  "3/5 hold",
);

assertEqual(
  trackProgressFromWorkSets({ feel: "miss", sets: [work(5, 5)] }),
  "hold",
  "miss hold",
);

assertEqual(
  trackProgressFromWorkSets({
    feel: "easy",
    sets: [
      {
        ...work(8, 12),
        planned_reps_to: 12,
        planned_reps: 8,
        actual_reps: 12,
      },
    ],
  }),
  "up",
  "rep range all 12 up",
);

assertEqual(
  trackProgressFromWorkSets({
    feel: "easy",
    sets: [
      {
        ...work(8, 10),
        planned_reps_to: 12,
        planned_reps: 8,
        actual_reps: 10,
      },
    ],
  }),
  "maintain",
  "rep range 10 maintain",
);

assertEqual(
  trackProgressFromWorkSets({
    feel: "easy",
    sets: [
      {
        ...work(8, 6),
        planned_reps_to: 8,
        planned_reps: 6,
        actual_reps: 6,
      },
    ],
  }),
  "maintain",
  "rep range 6 maintain",
);

assertEqual(
  shouldEaseTrackAfterHolds({
    outcomes: ["maintain", "maintain", "maintain"],
    workingWeights: [80, 80, 80],
  }),
  false,
  "maintain streak does not ease",
);

assertEqual(
  trackProgressFromWorkSets({
    feel: "easy",
    sets: [work(5, 5, 80, 75)],
  }),
  "hold",
  "under planned weight",
);

assertEqual(peakWorkWeight([work(5, 5), work(5, 5, 80, 90)]), 90, "peak");

assertEqual(
  shouldEaseTrackAfterHolds({
    outcomes: ["hold", "hold", "hold"],
    workingWeights: [80, 80, 80],
  }),
  true,
  "three holds same weight",
);

assertEqual(
  shouldEaseTrackAfterHolds({
    outcomes: ["hold", "up", "hold"],
    workingWeights: [80, 80, 80],
  }),
  false,
  "broken streak",
);

assertEqual(easedWeightTenPercent(80, 2.5), 70, "10% ease");
