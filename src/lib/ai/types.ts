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
  carbs: number;
  carbs_target: number;
  kcal: number;
  kcal_target: number;
  weight: number | null;
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
  note: string | null;
};

export type ReviewMaxRow = {
  name: string;
  percent: number | null;
  delta: number | null;
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
    days: ReviewDayRow[];
    foods: FoodShare[];
  };
  gym: {
    completed: number;
    skipped: number;
    dynamic: number;
    static: number;
    plan_hit: number;
    plan_total: number;
    templates: Array<{ name: string; count: number }>;
    weak: string[];
    notes: Array<{ date: string; name: string; note: string }>;
    sessions: ReviewSessionRow[];
  };
  phase: {
    type: string | null;
    completed: number | null;
    circle: number | null;
    suggest_end: boolean;
  };
  maxes: {
    grown: number;
    total: number;
    avg_percent: number | null;
    avg_relative_percent: number | null;
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
};

export type ReviewText = {
  headline: string;
  observations: string[];
  watch: string[];
};

export type ReviewSnapshot = {
  configured: boolean;
  brief: ReviewBrief;
  review: ReviewText | null;
};
