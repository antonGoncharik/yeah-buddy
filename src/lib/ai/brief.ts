import {
  compactDay,
  compactFeels,
  compactMaxes,
  compactSessions,
  compactWeight,
  roundAverages,
  sessionNotes,
  weakTemplates,
} from "@/lib/ai/compact";
import { reviewCoverage } from "@/lib/ai/coverage";
import { round1 } from "@/lib/ai/format";
import type { ReviewSource } from "@/lib/ai/review-source";
import { buildSignals } from "@/lib/ai/signal-lines";
import type { ReviewBrief } from "@/lib/ai/types";
import { nutritionHits, splitAverages } from "@/lib/nutrition-stats";
import {
  summarizeWorkoutHistory,
  windowGymSessions,
} from "@/lib/workout/history-stats";
import { phaseLabel } from "@/lib/workout/labels";
import {
  CATEGORY_SHORT_LABELS,
  categoryAverages,
} from "@/lib/workout/progress-stats";

export function buildReviewBrief(source: ReviewSource): ReviewBrief {
  const days = [...source.days].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const gymWindow = windowGymSessions(source.sessions, source.range, source.to);
  const gymStats = summarizeWorkoutHistory(gymWindow);
  const skipped = source.sessions.filter(
    (item) =>
      item.session.status === "skipped" &&
      item.session.session_date >= source.from &&
      item.session.session_date <= source.to,
  ).length;
  const averages = splitAverages(days);
  const hits = nutritionHits(days);
  const rest = roundAverages(averages.rest);
  const training = roundAverages(averages.training);
  const sessionRows = compactSessions(source.sessions, source.from, source.to);
  const maxes = compactMaxes(source.progress);
  const weight = compactWeight(days, source.seedWeight ?? null, source.from);
  const categories = categoryAverages(source.progress.exercises).map((row) => ({
    name: CATEGORY_SHORT_LABELS[row.id],
    percent: round1(row.avg_percent),
  }));
  const signals = buildSignals({
    days,
    rest,
    training,
    proteinHit: hits.proteinHit,
    proteinTotal: hits.proteinTotal,
    kcalHit: hits.kcalHit,
    kcalTotal: hits.kcalTotal,
    weight,
    foods: source.foods,
    gym: {
      completed: gymStats.count,
      skipped,
      planHit: gymStats.planHit,
      planTotal: gymStats.planTotal,
      templates: gymStats.templates,
      weak: weakTemplates(gymWindow),
      feels: compactFeels(sessionRows),
    },
    phase: source.macro,
    maxes,
    categories,
    avgPercent:
      source.progress.avg_percent == null
        ? null
        : round1(source.progress.avg_percent),
    avgRelativePercent:
      source.progress.avg_relative_percent == null
        ? null
        : round1(source.progress.avg_relative_percent),
  });

  return {
    range: source.range,
    from: source.from,
    to: source.to,
    coverage: reviewCoverage(days.length, gymStats.count),
    nutrition: {
      logged: days.length,
      rest,
      training,
      protein_hit: hits.proteinHit,
      protein_total: hits.proteinTotal,
      kcal_hit: hits.kcalHit,
      kcal_total: hits.kcalTotal,
      weight,
      days: days.map(compactDay),
      foods: source.foods,
    },
    gym: {
      completed: gymStats.count,
      skipped,
      dynamic: gymStats.dynamic,
      static: gymStats.static,
      plan_hit: gymStats.planHit,
      plan_total: gymStats.planTotal,
      templates: gymStats.templates,
      weak: weakTemplates(gymWindow),
      notes: sessionNotes(sessionRows),
      sessions: sessionRows,
      feels: compactFeels(sessionRows),
    },
    phase: {
      type: source.macro.phase
        ? phaseLabel(source.macro.phase.phase_type, source.macro.phase.name)
        : null,
      completed: source.macro.phase_circle?.completed_count ?? null,
      circle: source.macro.phase_circle?.circle_size ?? null,
      suggest_end: source.macro.phase_circle?.suggest_end ?? false,
    },
    maxes: {
      since: "first_work",
      grown: maxes.grownCount,
      total: source.progress.exercises.length,
      avg_percent:
        source.progress.avg_percent == null
          ? null
          : round1(source.progress.avg_percent),
      avg_relative_percent:
        source.progress.avg_relative_percent == null
          ? null
          : round1(source.progress.avg_relative_percent),
      categories,
      grown_list: maxes.grown,
      stalled: maxes.stalled,
      last_recap: source.macro.last_recap
        ? {
            from:
              source.macro.last_recap.from_name ||
              phaseLabel(source.macro.last_recap.from_phase),
            to:
              source.macro.last_recap.to_name ||
              phaseLabel(source.macro.last_recap.to_phase),
            avg_percent:
              source.macro.last_recap.avg_percent == null
                ? null
                : round1(source.macro.last_recap.avg_percent),
            grown: source.macro.last_recap.grown_count,
          }
        : null,
    },
    signals,
  };
}
