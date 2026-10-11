import type { MuscleCell } from "@/lib/types";
import { buildMuscleInsights } from "@/lib/workout/muscle-insights";

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
