import type { ReviewRange } from "@/lib/ai/range";
import type { FoodShare } from "@/lib/days";
import type { Macros } from "@/lib/nutrition";

export type ReviewCoverage = "empty" | "thin" | "ok";

export type ReviewAverages = {
  count: number;
  fact: Macros;
  target: Macros;
};

export type ReviewDayRow = {
  date: string;
  training: boolean;
  protein: number;
  protein_target: number;
  fat: number;
  fat_target: number;
  carbs: number;
  carbs_target: number;
  kcal: number;
  kcal_target: number;
  weight: number | null;
  waist: number | null;
};

export type ReviewMeasure = {
  logged: number;
  start: number | null;
  end: number | null;
  delta: number | null;
};

export type ReviewWeight = {
  logged: number;
  start: number | null;
  end: number | null;
  delta: number | null;
  protein_per_kg: number | null;
  protein_per_kg_target: number | null;
};

export type ReviewSessionRow = {
  date: string;
  name: string;
  kind: "dynamic" | "static";
  status: "completed" | "skipped";
  plan_hit: number;
  plan_total: number;
  as_planned: boolean;
  note: string | null;
  feel: "easy" | "close" | "miss" | null;
  work: string | null;
};

export type ReviewRecord = {
  name: string;
  date: string;
  weight: number;
  previous: number;
};

export type ReviewWeekTonnage = {
  start: string;
  tonnage: number;
};

export type ReviewMaxRow = {
  name: string;
  category: string | null;
  percent: number | null;
  relative_percent: number | null;
  delta: number | null;
  start: number | null;
  current: number | null;
  start_relative: number | null;
  current_relative: number | null;
  tonnage_percent: number | null;
};

export type ReviewBrief = {
  range: ReviewRange;
  from: string;
  to: string;
  coverage: ReviewCoverage;
  nutrition: {
    logged: number;
    rest: ReviewAverages | null;
    training: ReviewAverages | null;
    protein_hit: number;
    protein_total: number;
    kcal_hit: number;
    kcal_total: number;
    weight: ReviewWeight;
    waist: ReviewMeasure | null;
    halves: { first: ReviewAverages; second: ReviewAverages } | null;
    days: ReviewDayRow[];
    foods: FoodShare[];
    foods_rest: FoodShare[];
    foods_training: FoodShare[];
  };
  gym: {
    completed: number;
    skipped: number;
    dynamic: number;
    static: number;
    plan_hit: number;
    plan_total: number;
    as_planned: number;
    templates: Array<{ name: string; count: number }>;
    weak: string[];
    notes: Array<{ date: string; name: string; note: string }>;
    sessions: ReviewSessionRow[];
    feels: { easy: number; close: number; miss: number };
    per_week: number | null;
    circle_size: number;
    tonnage: number | null;
    tonnage_weeks: ReviewWeekTonnage[];
    records: ReviewRecord[];
    rate_halves: { first: number; second: number } | null;
    gap_days: number | null;
  };
  phase: {
    type: string | null;
    completed: number | null;
    circle: number | null;
    suggest_end: boolean;
  };
  maxes: {
    since: "window" | "first_work";
    grown: number;
    total: number;
    avg_percent: number | null;
    avg_relative_percent: number | null;
    categories: Array<{ name: string; percent: number }>;
    grown_list: ReviewMaxRow[];
    stalled: ReviewMaxRow[];
    last_recap: {
      from: string;
      to: string;
      avg_percent: number | null;
      grown: number;
    } | null;
  };
  signals: string[];
  /** Plain Russian стаж for the model, or null when unknown. */
  training_age: string | null;
};

export type ReviewText = {
  headline: string;
  observations: string[];
  watch: string[];
};

export type StoredReview = ReviewText & {
  from: string;
  to: string;
  written_at: string;
};

export type ReviewSnapshot = {
  configured: boolean;
  remaining: number | null;
  brief: ReviewBrief;
  review: StoredReview | null;
  previous: StoredReview | null;
};
