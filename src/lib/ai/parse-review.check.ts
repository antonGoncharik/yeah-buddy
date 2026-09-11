import { parseReviewSnapshot, parseStoredReview } from "@/lib/ai/parse-review";
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
    days: [],
    foods: [],
  },
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
  phase: {
    type: null,
    completed: null,
    circle: null,
    suggest_end: false,
  },
  maxes: {
    since: "first_work",
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

console.log("ai review store parse ok");
