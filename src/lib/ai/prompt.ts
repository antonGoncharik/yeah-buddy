import type { ReviewBrief } from "@/lib/ai/types";

export type ReviewPromptPayload = {
  range: ReviewBrief["range"];
  from: string;
  to: string;
  coverage: ReviewBrief["coverage"];
  nutrition: {
    logged: number;
    rest: ReviewBrief["nutrition"]["rest"];
    training: ReviewBrief["nutrition"]["training"];
    protein_hit: number;
    protein_total: number;
    kcal_hit: number;
    kcal_total: number;
    weight: ReviewBrief["nutrition"]["weight"];
    foods: ReviewBrief["nutrition"]["foods"];
  };
  gym: {
    completed: number;
    skipped: number;
    dynamic: number;
    static: number;
    plan_hit: number;
    plan_total: number;
    templates: ReviewBrief["gym"]["templates"];
    weak: string[];
    notes: ReviewBrief["gym"]["notes"];
    feels: ReviewBrief["gym"]["feels"];
  };
  phase: ReviewBrief["phase"];
  maxes: ReviewBrief["maxes"];
  signals: string[];
};

export function reviewPromptPayload(brief: ReviewBrief): ReviewPromptPayload {
  return {
    range: brief.range,
    from: brief.from,
    to: brief.to,
    coverage: brief.coverage,
    nutrition: {
      logged: brief.nutrition.logged,
      rest: brief.nutrition.rest,
      training: brief.nutrition.training,
      protein_hit: brief.nutrition.protein_hit,
      protein_total: brief.nutrition.protein_total,
      kcal_hit: brief.nutrition.kcal_hit,
      kcal_total: brief.nutrition.kcal_total,
      weight: brief.nutrition.weight,
      foods: brief.nutrition.foods.slice(0, 5),
    },
    gym: {
      completed: brief.gym.completed,
      skipped: brief.gym.skipped,
      dynamic: brief.gym.dynamic,
      static: brief.gym.static,
      plan_hit: brief.gym.plan_hit,
      plan_total: brief.gym.plan_total,
      templates: brief.gym.templates,
      weak: brief.gym.weak,
      notes: brief.gym.notes,
      feels: brief.gym.feels,
    },
    phase: brief.phase,
    maxes: brief.maxes,
    signals: brief.signals,
  };
}
