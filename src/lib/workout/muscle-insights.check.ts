import type { MuscleCell, MuscleSnapshot } from "@/lib/types";
import {
  buildMuscleBalance,
  buildMuscleInsights,
  muscleHubRecoveryHint,
  todayMuscleProteinHint,
} from "@/lib/workout/muscle-insights";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

const muscles: MuscleCell[] = [
  {
    id: "chest",
    label: "Грудь",
    view: "front",
    sets: 8,
    sets_per_week: 4,
    volume_band: 2,
    last_trained: "2026-10-01",
    days_since: 20,
    in_next_session: false,
    missed_sessions: 0,
    weekly_sets: [4, 4],
    direct_sets: 8,
    assist_sets: 0,
    recovery_percent: 40,
  },
  {
    id: "upper_back",
    label: "Верх спины",
    view: "back",
    sets: 12,
    sets_per_week: 6,
    volume_band: 2,
    last_trained: "2026-10-08",
    days_since: 2,
    in_next_session: false,
    missed_sessions: 0,
    weekly_sets: [6, 6],
    direct_sets: 12,
    assist_sets: 0,
    recovery_percent: 72,
  },
];

const lines = buildMuscleInsights({
  muscles,
  missed: [
    {
      date: "2026-10-05",
      template_name: "Спина",
      muscles: ["upper_back"],
    },
  ],
  planned_template_name: "Ноги",
});

assert(
  lines.some((line) => line.includes("Грудь")),
  "stale chest insight",
);
assert(
  lines.some((line) => line.includes("Пропуск")),
  "missed insight",
);
assert(
  lines.some((line) => line.includes("Ноги")),
  "planned insight",
);

const skewed = buildMuscleInsights({
  muscles: [
    {
      ...muscles[0],
      sets: 20,
      sets_per_week: 10,
      days_since: 1,
      last_trained: "2026-10-11",
    },
    {
      id: "lats",
      label: "Широчайшие",
      view: "back",
      sets: 2,
      sets_per_week: 1,
      volume_band: 1,
      last_trained: "2026-10-10",
      days_since: 1,
      in_next_session: false,
      missed_sessions: 0,
      weekly_sets: [1],
      direct_sets: 2,
      assist_sets: 0,
      recovery_percent: 90,
    },
  ],
  missed: [],
  planned_template_name: null,
});

assert(
  skewed.some((line) => line.startsWith("Спина слабее груди")),
  "names the lighter side, not the first id",
);
assert(
  skewed.every((line) => !line.startsWith("Грудь слабее")),
  "does not call the heavier chest weak",
);

const balance = buildMuscleBalance(
  [
    {
      ...muscles[0],
      sets: 20,
      sets_per_week: 10,
      direct_sets: 10,
      assist_sets: 0,
    },
    {
      id: "lats",
      label: "Широчайшие",
      view: "back",
      sets: 2,
      sets_per_week: 1,
      volume_band: 1,
      last_trained: "2026-10-10",
      days_since: 1,
      in_next_session: false,
      missed_sessions: 0,
      weekly_sets: [1],
      direct_sets: 2,
      assist_sets: 0,
      recovery_percent: 90,
    },
  ],
  14,
);
const chestBack = balance.find((item) => item.a === "chest");
assert(chestBack?.label_a === "Грудь", "balance names chest");
assert(chestBack?.label_b === "Спина", "balance folds lats into the back side");
assert(chestBack?.sets_a === 10, "balance keeps chest weekly sets");
assert(
  chestBack?.sets_b === 1,
  "balance keeps lat weekly sets on the back side",
);

const hubHint = muscleHubRecoveryHint([
  {
    ...muscles[0],
    in_next_session: true,
    recovery_percent: 55,
  },
]);
assert(
  hubHint?.includes("55%") ?? false,
  "hub hints low recovery for next session",
);

const snapshot: MuscleSnapshot = {
  horizon_days: 14,
  since: "2026-09-29",
  until: "2026-10-12",
  figure_sex: null,
  muscles: [
    {
      ...muscles[0],
      in_next_session: true,
      sets_per_week: 2,
      direct_sets: 4,
      volume_band: 1,
    },
  ],
  hits_by_muscle: {},
  missed: [],
  balance: [],
  insights: [],
  planned_template_name: "A",
  completed_sessions: 0,
  skipped_sessions: 0,
  unmapped_exercise_count: 0,
};
const proteinHint = todayMuscleProteinHint(snapshot, 80);
assert(
  proteinHint?.includes("белка") ?? false,
  "today links muscle gap to protein",
);
