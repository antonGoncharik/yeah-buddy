import {
  dayInsightFromBrief,
  templateInsightsFromBrief,
} from "@/lib/ai/template-insights";
import type { ReviewBrief } from "@/lib/ai/types";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

function emptyBrief(): ReviewBrief {
  return {
    range: 14,
    from: "2026-10-01",
    to: "2026-10-07",
    coverage: "empty",
    nutrition: {
      logged: 0,
      rest: null,
      training: null,
      protein_hit: 0,
      protein_total: 0,
      kcal_hit: 0,
      kcal_total: 0,
      weight: {
        logged: 0,
        start: null,
        end: null,
        delta: null,
        protein_per_kg: null,
        protein_per_kg_target: null,
      },
      energy: null,
      waist: null,
      halves: null,
      days: [],
      foods: [],
      foods_rest: [],
      foods_training: [],
    },
    gym: {
      completed: 0,
      skipped: 0,
      dynamic: 0,
      static: 0,
      plan_hit: 0,
      plan_total: 0,
      as_planned: 0,
      templates: [],
      weak: [],
      notes: [],
      sessions: [],
      feels: { easy: 0, close: 0, miss: 0 },
      per_week: null,
      circle_size: 0,
      tonnage: null,
      tonnage_weeks: [],
      records: [],
      rate_halves: null,
      gap_days: null,
    },
    phase: {
      type: null,
      completed: null,
      circle: null,
      suggest_end: false,
    },
    maxes: {
      since: "window",
      grown: 0,
      total: 0,
      avg_percent: null,
      avg_relative_percent: null,
      categories: [],
      grown_list: [],
      stalled: [],
      last_recap: null,
    },
    signals: [],
    sex: null,
    goal: null,
    training_age: null,
  };
}

assert(templateInsightsFromBrief(emptyBrief()).length === 0, "empty brief");

const withGym = emptyBrief();
withGym.coverage = "ok";
withGym.gym.completed = 2;
const lines = templateInsightsFromBrief(withGym);
assert(
  lines.some((l) => l.includes("Зал")),
  "gym line",
);
assert(dayInsightFromBrief(withGym) != null, "day insight");

export default Promise.resolve();
