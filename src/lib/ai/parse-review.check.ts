import {
  parseReviewBrief,
  parseReviewSnapshot,
  parseStoredReview,
} from "@/lib/ai/parse-review";
import { reviewPromptPayload } from "@/lib/ai/prompt";
import type { ReviewBrief, StoredReview } from "@/lib/ai/types";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const text = {
  headline: "Белок держался",
  observations: ["Во второй половине ккал −8%."],
  watch: ["Углеводы после зала"],
};

assertEqual(
  parseStoredReview({
    ...text,
    from: "2026-08-16",
    to: "2026-08-29",
    written_at: "2026-08-29T18:00:00.000Z",
  }),
  {
    ...text,
    from: "2026-08-16",
    to: "2026-08-29",
    written_at: "2026-08-29T18:00:00.000Z",
  },
  "stored review",
);

assertEqual(
  parseStoredReview(text)?.headline,
  "Белок держался",
  "old cache still reads",
);

const previous: StoredReview = {
  ...text,
  from: "2026-08-02",
  to: "2026-08-15",
  written_at: "2026-08-15T18:00:00.000Z",
};

const brief = {
  range: 14,
  from: "2026-08-16",
  to: "2026-08-29",
  coverage: "ok",
  nutrition: {
    logged: 10,
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
    halves: null,
    days: [],
    foods: [],
    foods_rest: [],
    foods_training: [],
    waist: null,
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
} satisfies ReviewBrief;

assertEqual(
  reviewPromptPayload(brief, previous).previous?.headline,
  "Белок держался",
  "prompt keeps previous",
);
assertEqual(reviewPromptPayload(brief).previous, null, "prompt previous empty");

assertEqual(
  parseReviewSnapshot({
    configured: true,
    brief,
    review: { ...text, from: "2026-08-16", to: "2026-08-29", written_at: "t" },
    previous,
  })?.previous?.from,
  "2026-08-02",
  "snapshot previous",
);
assertEqual(
  parseReviewSnapshot({
    configured: true,
    remaining: 3,
    brief,
    review: null,
    previous: null,
  })?.remaining,
  3,
  "snapshot remaining",
);
assertEqual(
  parseReviewSnapshot({
    configured: true,
    brief,
    review: null,
    previous: null,
  })?.remaining,
  null,
  "old snapshot without remaining still reads",
);

assertEqual(
  parseReviewBrief({ ...brief, range: 90 })?.range,
  90,
  "90-day review parses",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    gym: {
      ...brief.gym,
      sessions: [
        {
          date: "2026-08-20",
          name: "Низ",
          kind: "dynamic",
          status: "completed",
          plan_hit: 1,
          plan_total: 1,
          as_planned: false,
          note: null,
          feel: "close",
          work: "Присед 140×5",
        },
      ],
    },
  })?.gym.sessions[0]?.work,
  "Присед 140×5",
  "session work parses",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    gym: {
      ...brief.gym,
      sessions: [
        {
          date: "2026-08-20",
          name: "Низ",
          kind: "dynamic",
          status: "completed",
          plan_hit: 0,
          plan_total: 0,
          as_planned: true,
          note: null,
          feel: null,
        },
      ],
    },
  })?.gym.sessions[0]?.work,
  null,
  "old session without work",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    gym: {
      completed: 0,
      skipped: 0,
      dynamic: 0,
      static: 0,
      plan_hit: 0,
      plan_total: 0,
      templates: [],
      weak: [],
      notes: [],
      sessions: [],
      feels: { easy: 0, close: 0, miss: 0 },
    },
  })?.gym.records.length,
  0,
  "old brief without records still reads",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    sex: undefined,
    goal: undefined,
    training_age: undefined,
    nutrition: {
      ...brief.nutrition,
      waist: undefined,
      foods_rest: undefined,
      foods_training: undefined,
    },
  })?.nutrition.foods_training.length,
  0,
  "old brief without food split",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    sex: "женщина",
    goal: "похудеть",
    training_age: "несколько лет",
    nutrition: {
      ...brief.nutrition,
      waist: { logged: 2, start: 86, end: 84, delta: -2 },
    },
  })?.sex,
  "женщина",
  "sex label parses",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    sex: "женщина",
    goal: "похудеть",
    training_age: "несколько лет",
    nutrition: {
      ...brief.nutrition,
      waist: { logged: 2, start: 86, end: 84, delta: -2 },
    },
  })?.goal,
  "похудеть",
  "goal label parses",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    sex: "женщина",
    goal: "похудеть",
    training_age: "несколько лет",
    nutrition: {
      ...brief.nutrition,
      waist: { logged: 2, start: 86, end: 84, delta: -2 },
    },
  })?.training_age,
  "несколько лет",
  "training age label parses",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    sex: "male",
    goal: "lose",
    training_years: 8,
    nutrition: {
      ...brief.nutrition,
      waist: { logged: 2, start: 86, end: 84, delta: -2 },
    },
  })?.sex,
  null,
  "raw sex id is ignored",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    sex: "male",
    goal: "lose",
    training_years: 8,
    nutrition: {
      ...brief.nutrition,
      waist: { logged: 2, start: 86, end: 84, delta: -2 },
    },
  })?.goal,
  null,
  "raw goal id is ignored",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    training_years: 8,
    nutrition: {
      ...brief.nutrition,
      waist: { logged: 2, start: 86, end: 84, delta: -2 },
    },
  })?.training_age,
  null,
  "old year count is ignored",
);
assertEqual(
  parseReviewBrief({
    ...brief,
    training_years: 8,
    nutrition: {
      ...brief.nutrition,
      waist: { logged: 2, start: 86, end: 84, delta: -2 },
    },
  })?.nutrition.waist?.delta,
  -2,
  "waist window parses",
);

console.log("ai review store parse ok");
