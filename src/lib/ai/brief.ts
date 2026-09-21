import {
  compactFeels,
  compactMaxes,
  compactSessions,
  sessionNotes,
  weakTemplates,
} from "@/lib/ai/compact-gym";
import {
  compactDay,
  compactWaist,
  compactWeight,
  roundAverages,
} from "@/lib/ai/compact-nutrition";
import { reviewCoverage } from "@/lib/ai/coverage";
import { round1 } from "@/lib/ai/format";
import type { ReviewSource } from "@/lib/ai/review-source";
import { buildSignals } from "@/lib/ai/signal-lines";
import { halfWindow } from "@/lib/ai/signal-nutrition-window";
import type { ReviewBrief } from "@/lib/ai/types";
import { nutritionHits, splitAverages } from "@/lib/nutrition-stats";
import {
  GYM_GAP_DAYS,
  gymGapDays,
  sessionRateHalves,
  summarizeWorkoutHistory,
  windowGymSessions,
  workoutsPerWeek,
} from "@/lib/workout/history-stats";
import { phaseLabel } from "@/lib/workout/labels";
import {
  peakRecords,
  totalTonnage,
  weeklyTonnage,
} from "@/lib/workout/progress-control";
import {
  CATEGORY_SHORT_LABELS,
  categoryAverages,
} from "@/lib/workout/progress-stats";
import { windowStrengthProgress } from "@/lib/workout/progress-window";

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
  const progress = windowStrengthProgress(
    source.progress,
    source.from,
    source.to,
  );
  const maxes = compactMaxes(progress);
  const weight = compactWeight(days, source.seedWeight ?? null, source.from);
  const categories = categoryAverages(progress.exercises).map((row) => ({
    name: CATEGORY_SHORT_LABELS[row.id],
    percent: round1(row.avg_percent),
  }));
  const perWeek = workoutsPerWeek(gymStats.count, source.range);
  const circleSize =
    source.progress.circle_size > 0
      ? source.progress.circle_size
      : (source.macro.phase_circle?.circle_size ?? 0);
  const records = peakRecords(
    source.progress.exercises,
    source.from,
    source.to,
  ).slice(0, 12);
  const tonnageWeeks = weeklyTonnage(
    source.progress.exercises,
    source.from,
    source.to,
  );
  const tonnageSum = totalTonnage(tonnageWeeks);
  const gymDates = gymWindow.map((item) => item.session.session_date);
  const rateHalves = sessionRateHalves(gymDates, source.from, source.to);
  const gapDays = gymGapDays(source.from, source.to, gymDates);
  const gap = gapDays >= GYM_GAP_DAYS ? gapDays : null;
  const signals = buildSignals({
    days,
    from: source.from,
    to: source.to,
    windowDays: source.range,
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
      asPlanned: gymStats.asPlanned,
      templates: gymStats.templates,
      weak: weakTemplates(gymWindow),
      feels: compactFeels(sessionRows),
      perWeek: perWeek > 0 ? perWeek : null,
      circleSize,
      records,
      tonnageWeeks,
      rateHalves,
      gapDays: gap,
    },
    phase: source.macro,
    maxes: {
      grown: maxes.grown.slice(0, 8),
      stalled: maxes.stalled.slice(0, 8),
    },
    categories,
    avgPercent:
      progress.avg_percent == null ? null : round1(progress.avg_percent),
    avgRelativePercent:
      progress.avg_relative_percent == null
        ? null
        : round1(progress.avg_relative_percent),
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
      waist: compactWaist(days, source.seedWaist ?? null, source.from),
      halves: halfWindow(days),
      days: days.map(compactDay),
      foods: source.foods,
      foods_rest: source.foodsRest ?? [],
      foods_training: source.foodsTraining ?? [],
    },
    gym: {
      completed: gymStats.count,
      skipped,
      dynamic: gymStats.dynamic,
      static: gymStats.static,
      plan_hit: gymStats.planHit,
      plan_total: gymStats.planTotal,
      as_planned: gymStats.asPlanned,
      templates: gymStats.templates,
      weak: weakTemplates(gymWindow),
      notes: sessionNotes(sessionRows),
      sessions: sessionRows,
      feels: compactFeels(sessionRows),
      per_week: perWeek > 0 ? perWeek : null,
      circle_size: circleSize,
      tonnage: tonnageSum > 0 ? tonnageSum : null,
      tonnage_weeks: tonnageWeeks,
      records,
      rate_halves: rateHalves,
      gap_days: gap,
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
      since: "window",
      grown: maxes.grownCount,
      total: progress.exercises.length,
      avg_percent:
        progress.avg_percent == null ? null : round1(progress.avg_percent),
      avg_relative_percent:
        progress.avg_relative_percent == null
          ? null
          : round1(progress.avg_relative_percent),
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
    training_years: source.trainingYears ?? null,
  };
}
