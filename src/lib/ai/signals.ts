import {
  formatG,
  formatKcalPlain,
  formatPct,
  round0,
  round1,
} from "@/lib/ai/format";
import type { ReviewRange } from "@/lib/ai/range";
import type {
  ReviewAverages,
  ReviewBrief,
  ReviewCoverage,
  ReviewDayRow,
  ReviewMaxRow,
  ReviewSessionRow,
  ReviewWeight,
} from "@/lib/ai/types";
import {
  bodyWeightWindow,
  formatBodyWeight,
  formatProteinPerKg,
  formatRelative,
  formatSignedBodyWeight,
} from "@/lib/day/body-weight";
import type { FoodShare } from "@/lib/days";
import type { Macros } from "@/lib/nutrition";
import {
  averageMacros,
  KCAL_HIT_RATIO,
  nutritionHits,
  splitAverages,
} from "@/lib/nutrition-stats";
import type {
  CurrentMacroState,
  DayHistoryRow,
  ExerciseProgress,
  RecentWorkoutSession,
  StrengthProgress,
} from "@/lib/types";
import {
  pluralWorkouts,
  summarizeWorkoutHistory,
  windowGymSessions,
} from "@/lib/workout/history-stats";
import { phaseLabel, WORKOUT_KIND_LABELS } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";
import {
  CATEGORY_SHORT_LABELS,
  categoryAverages,
} from "@/lib/workout/progress-stats";

const PROTEIN_MISS_G = 20;
const CARBS_MISS_RATIO = 0.9;
const HALF_KCAL_RATIO = 0.08;
const HALF_PROTEIN_G = 12;
const WEIGHT_DELTA_KG = 0.5;
const RELATIVE_VS_BAR_PCT = 2;
const WEAK_PLAN_RATIO = 0.75;
const WEAK_PLAN_MIN_SETS = 3;

export type ReviewSource = {
  range: ReviewRange;
  from: string;
  to: string;
  days: DayHistoryRow[];
  sessions: RecentWorkoutSession[];
  foods: FoodShare[];
  macro: CurrentMacroState;
  progress: StrengthProgress;
  seedWeight?: number | null;
};

export function reviewCoverage(
  loggedDays: number,
  completedWorkouts: number,
): ReviewCoverage {
  if (loggedDays === 0 && completedWorkouts === 0) {
    return "empty";
  }
  if (loggedDays < 5 && completedWorkouts < 3) {
    return "thin";
  }
  return "ok";
}

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

export function buildSignals(input: {
  days: DayHistoryRow[];
  rest: ReviewAverages | null;
  training: ReviewAverages | null;
  proteinHit: number;
  proteinTotal: number;
  kcalHit: number;
  kcalTotal: number;
  weight: ReviewWeight;
  foods: FoodShare[];
  gym: {
    completed: number;
    skipped: number;
    planHit: number;
    planTotal: number;
    templates: Array<{ name: string; count: number }>;
    weak: string[];
  };
  phase: CurrentMacroState;
  maxes: { grown: ReviewMaxRow[]; stalled: ReviewMaxRow[] };
  categories?: Array<{ name: string; percent: number }>;
  avgPercent?: number | null;
  avgRelativePercent?: number | null;
}): string[] {
  const lines: string[] = [];

  if (input.proteinTotal >= 3) {
    lines.push(
      `Белок дотянули: ${input.proteinHit} из ${input.proteinTotal} дней.`,
    );
  }
  if (input.kcalTotal >= 3) {
    lines.push(
      `Калории около цели (±${Math.round(KCAL_HIT_RATIO * 100)}%): ${input.kcalHit} из ${input.kcalTotal} дней.`,
    );
  }

  if (input.rest) {
    lines.push(formatAverageLine("Отдых", input.rest));
  }
  if (input.training) {
    lines.push(formatAverageLine("Зал", input.training));
  }

  const weight = input.weight;
  if (weight.start != null && weight.end != null) {
    const delta = weight.delta ?? 0;
    if (Math.abs(delta) >= WEIGHT_DELTA_KG) {
      lines.push(
        `Вес ${formatSignedBodyWeight(delta)} кг (${formatBodyWeight(weight.start)} → ${formatBodyWeight(weight.end)}).`,
      );
    } else {
      lines.push(`Вес около ${formatBodyWeight(weight.end)} кг.`);
    }
  }

  if (
    weight.protein_per_kg != null &&
    weight.protein_per_kg_target != null &&
    (weight.logged >= 1 || input.days.length >= 2)
  ) {
    lines.push(
      `Белок ${formatProteinPerKg(weight.protein_per_kg)} при цели ${formatProteinPerKg(weight.protein_per_kg_target)}.`,
    );
  }

  const trainingCarbs = input.training;
  if (
    trainingCarbs &&
    trainingCarbs.target.carbs > 0 &&
    trainingCarbs.fact.carbs < trainingCarbs.target.carbs * CARBS_MISS_RATIO
  ) {
    const miss = trainingCarbs.target.carbs - trainingCarbs.fact.carbs;
    lines.push(
      `В тренировочные дни углеводов не хватало на ${formatG(miss)} г.`,
    );
  }

  if (input.rest && input.training) {
    const delta = input.training.fact.protein - input.rest.fact.protein;
    if (Math.abs(delta) >= 10) {
      lines.push(
        delta > 0
          ? `В тренировочные дни белка больше, чем на отдыхе, на ${formatG(delta)} г.`
          : `В тренировочные дни белка меньше, чем на отдыхе, на ${formatG(-delta)} г.`,
      );
    }
  }

  const halves = halfWindow(input.days);
  if (halves) {
    const kcalRatio =
      halves.first.target.kcal > 0
        ? (halves.second.fact.kcal - halves.first.fact.kcal) /
          Math.max(halves.first.fact.kcal, 1)
        : 0;
    const proteinDelta = halves.second.fact.protein - halves.first.fact.protein;
    if (
      Math.abs(kcalRatio) >= HALF_KCAL_RATIO ||
      Math.abs(proteinDelta) >= HALF_PROTEIN_G
    ) {
      const kcalPart =
        Math.abs(kcalRatio) >= HALF_KCAL_RATIO
          ? `ккал ${formatPct(kcalRatio * 100)}`
          : null;
      const proteinPart =
        Math.abs(proteinDelta) >= HALF_PROTEIN_G
          ? `белок ${proteinDelta > 0 ? "+" : "−"}${formatG(Math.abs(proteinDelta))} г`
          : null;
      const parts = [kcalPart, proteinPart].filter(
        (item): item is string => item != null,
      );
      lines.push(`Во второй половине: ${parts.join(", ")}.`);
    }
  }

  const worst = worstProteinDays(input.days);
  if (worst.length > 0) {
    lines.push(
      `Мало белка: ${worst
        .map(
          (item) =>
            `${item.date} (−${formatG(item.miss)} г${item.training ? ", зал" : ""})`,
        )
        .join("; ")}.`,
    );
  }

  if (input.foods.length > 0) {
    lines.push(
      `Топ белка: ${input.foods
        .slice(0, 5)
        .map((item) => `${item.name} ${formatG(item.protein)} г`)
        .join(", ")}.`,
    );
  }

  if (input.gym.completed > 0) {
    const plan =
      input.gym.planTotal > 0
        ? `, не слабее плана ${input.gym.planHit} из ${input.gym.planTotal}`
        : "";
    lines.push(
      `Зал: ${input.gym.completed} ${pluralWorkouts(input.gym.completed)}${plan}.`,
    );
  }
  if (input.gym.skipped > 0) {
    lines.push(`Пропусков: ${input.gym.skipped}.`);
  }
  if (input.gym.templates.length > 0) {
    lines.push(
      `Тренировки: ${input.gym.templates
        .map((item) => `${item.name} · ${item.count}`)
        .join(", ")}.`,
    );
  }
  if (input.gym.weak.length > 0) {
    lines.push(`Слабее плана: ${input.gym.weak.join(", ")}.`);
  }

  const circle = input.phase.phase_circle;
  if (input.phase.phase && circle) {
    const extra = circle.suggest_end ? ", круг можно закрыть" : "";
    lines.push(
      `Этап «${phaseLabel(input.phase.phase.phase_type, input.phase.phase.name)}» · ${circle.completed_count} из ${circle.circle_size}${extra}.`,
    );
  }

  const recap = input.phase.last_recap;
  if (recap) {
    const from = recap.from_name || phaseLabel(recap.from_phase);
    const to = recap.to_name || phaseLabel(recap.to_phase);
    const pct = recap.avg_percent == null ? null : formatPct(recap.avg_percent);
    lines.push(
      pct == null
        ? `Прошлый цикл «${from}» → «${to}», выросли ${recap.grown_count}.`
        : `Прошлый цикл «${from}» → «${to}»: рабочие ${pct}, выросли ${recap.grown_count}.`,
    );
  }

  if (input.maxes.grown.length > 0) {
    lines.push(`Выросли: ${input.maxes.grown.map(formatMaxRow).join(", ")}.`);
  }
  if (input.maxes.stalled.length > 0) {
    lines.push(
      `Без роста: ${input.maxes.stalled.map((item) => item.name).join(", ")}.`,
    );
  }

  const delta = weight.delta;
  if (
    delta != null &&
    delta <= -WEIGHT_DELTA_KG &&
    input.maxes.grown.length > 0
  ) {
    lines.push(`Вес ${formatSignedBodyWeight(delta)} кг, рабочие выросли.`);
  } else if (
    delta != null &&
    delta >= WEIGHT_DELTA_KG &&
    input.maxes.grown.length > 0
  ) {
    lines.push(
      `Вес ${formatSignedBodyWeight(delta)} кг, рабочие тоже выросли.`,
    );
  }

  if (
    input.avgPercent != null &&
    input.avgRelativePercent != null &&
    Math.abs(input.avgRelativePercent - input.avgPercent) >= RELATIVE_VS_BAR_PCT
  ) {
    lines.push(
      `К весу тела рабочие ${formatPct(input.avgRelativePercent)}, по штанге ${formatPct(input.avgPercent)}.`,
    );
  } else if (
    input.avgRelativePercent != null &&
    Math.abs(input.avgRelativePercent) >= 1
  ) {
    lines.push(`К весу тела рабочие ${formatPct(input.avgRelativePercent)}.`);
  }

  if (input.categories && input.categories.length > 1) {
    lines.push(
      `По группам: ${input.categories
        .map((item) => `${item.name} ${formatPct(item.percent)}`)
        .join(", ")}.`,
    );
  }

  return lines;
}

export function compactDay(item: DayHistoryRow): ReviewDayRow {
  return {
    date: item.date,
    training: item.is_training_day,
    protein: round1(item.fact_protein),
    protein_target: round1(item.target_protein),
    carbs: round1(item.fact_carbs),
    carbs_target: round1(item.target_carbs),
    kcal: round0(item.fact_kcal),
    kcal_target: round0(item.target_kcal),
    weight: item.body_weight == null ? null : round1(item.body_weight),
  };
}

function compactWeight(
  days: DayHistoryRow[],
  seed: number | null,
  from: string,
): ReviewWeight {
  const stats = bodyWeightWindow(days, { seed, from });
  if (!stats) {
    return {
      logged: 0,
      start: null,
      end: null,
      delta: null,
      protein_per_kg: null,
      protein_per_kg_target: null,
    };
  }

  return {
    logged: stats.logged,
    start: stats.start == null ? null : round1(stats.start),
    end: stats.end == null ? null : round1(stats.end),
    delta: stats.delta == null ? null : round1(stats.delta),
    protein_per_kg: stats.protein_per_kg,
    protein_per_kg_target: stats.protein_per_kg_target,
  };
}

function roundAverages(
  stats: ReturnType<typeof averageMacros>,
): ReviewAverages | null {
  if (!stats) {
    return null;
  }

  return {
    count: stats.count,
    fact: roundMacros(stats.fact),
    target: roundMacros(stats.target),
  };
}

function roundMacros(macros: Macros): Macros {
  return {
    protein: round1(macros.protein),
    fat: round1(macros.fat),
    carbs: round1(macros.carbs),
    kcal: round0(macros.kcal),
  };
}

function compactSessions(
  items: RecentWorkoutSession[],
  from: string,
  to: string,
): ReviewSessionRow[] {
  return items.flatMap((item) => {
    const date = item.session.session_date;
    if (date < from || date > to) {
      return [];
    }
    if (
      item.session.status !== "completed" &&
      item.session.status !== "skipped"
    ) {
      return [];
    }

    return [
      {
        date,
        name:
          item.template_name?.trim() ||
          WORKOUT_KIND_LABELS[item.session.workout_type],
        kind: item.session.workout_type,
        status: item.session.status,
        plan_hit: item.plan_hit,
        plan_total: item.plan_total,
        note: item.session.note,
      },
    ];
  });
}

function sessionNotes(
  sessions: ReviewSessionRow[],
): Array<{ date: string; name: string; note: string }> {
  return sessions
    .flatMap((item) => {
      const note = item.note?.trim();
      if (!note) {
        return [];
      }
      return [
        {
          date: item.date,
          name: item.name,
          note: note.length > 140 ? `${note.slice(0, 137)}…` : note,
        },
      ];
    })
    .slice(0, 5);
}

function weakTemplates(items: RecentWorkoutSession[]): string[] {
  const totals = new Map<string, { hit: number; total: number }>();
  for (const item of items) {
    if (
      item.session.status !== "completed" ||
      item.plan_total < WEAK_PLAN_MIN_SETS
    ) {
      continue;
    }
    const name =
      item.template_name?.trim() ||
      WORKOUT_KIND_LABELS[item.session.workout_type];
    const current = totals.get(name) ?? { hit: 0, total: 0 };
    current.hit += item.plan_hit;
    current.total += item.plan_total;
    totals.set(name, current);
  }

  return [...totals.entries()]
    .filter(([, value]) => value.hit / value.total < WEAK_PLAN_RATIO)
    .map(([name]) => name)
    .sort((left, right) => left.localeCompare(right, "ru"));
}

function compactMaxes(progress: StrengthProgress): {
  grown: ReviewMaxRow[];
  stalled: ReviewMaxRow[];
  grownCount: number;
} {
  const rows = progress.exercises.flatMap((item) => {
    if (item.percent == null && item.relative_percent == null) {
      return [];
    }
    return [toMaxRow(item)];
  });
  const grown = rows
    .filter(isGrownMax)
    .sort((left, right) => maxChange(right) - maxChange(left));
  const stalled = rows
    .filter((item) => !isGrownMax(item))
    .sort((left, right) => maxChange(left) - maxChange(right));

  return {
    grown: grown.slice(0, 4),
    stalled: stalled.slice(0, 4),
    grownCount: grown.length,
  };
}

function toMaxRow(item: ExerciseProgress): ReviewMaxRow {
  return {
    name: item.name,
    percent: item.percent == null ? null : round1(item.percent),
    relative_percent:
      item.relative_percent == null ? null : round1(item.relative_percent),
    delta: item.delta == null ? null : round1(item.delta),
    start: item.start_weight == null ? null : round1(item.start_weight),
    current: item.current_weight == null ? null : round1(item.current_weight),
    start_relative:
      item.start_relative == null ? null : round2(item.start_relative),
    current_relative:
      item.current_relative == null ? null : round2(item.current_relative),
  };
}

function isGrownMax(item: ReviewMaxRow): boolean {
  return (item.percent ?? 0) > 0.5 || (item.relative_percent ?? 0) > 0.5;
}

function maxChange(item: ReviewMaxRow): number {
  return Math.max(
    item.percent ?? Number.NEGATIVE_INFINITY,
    item.relative_percent ?? Number.NEGATIVE_INFINITY,
  );
}

function formatMaxRow(item: ReviewMaxRow): string {
  const bar = item.percent == null ? null : formatPct(item.percent);
  const relative =
    item.relative_percent == null ? null : formatPct(item.relative_percent);
  const barGrown = (item.percent ?? 0) > 0.5;
  const relativeGrown = (item.relative_percent ?? 0) > 0.5;
  const kg = formatKgRange(item.start, item.current);
  const relRange = formatRelativeRange(
    item.start_relative,
    item.current_relative,
  );
  if (
    barGrown &&
    bar != null &&
    relative != null &&
    Math.abs((item.relative_percent ?? 0) - (item.percent ?? 0)) >=
      RELATIVE_VS_BAR_PCT
  ) {
    return joinMaxParts(
      item.name,
      `${bar}${kg}`,
      `к весу ${relative}${relRange}`,
    );
  }
  if (barGrown && bar != null) {
    return `${item.name} ${bar}${kg}`;
  }
  if (relativeGrown && relative != null) {
    return `${item.name} к весу ${relative}${relRange}`;
  }
  if (bar != null) {
    return `${item.name} ${bar}${kg}`;
  }
  return item.name;
}

function joinMaxParts(name: string, left: string, right: string): string {
  return `${name} ${left}, ${right}`;
}

function formatKgRange(start: number | null, current: number | null): string {
  if (start == null || current == null) {
    return "";
  }
  if (start === current) {
    return ` (${formatWeight(current)} кг)`;
  }
  return ` (${formatWeight(start)} → ${formatWeight(current)} кг)`;
}

function formatRelativeRange(
  start: number | null,
  current: number | null,
): string {
  if (start == null || current == null) {
    return "";
  }
  if (start === current) {
    return ` (${formatRelative(current)})`;
  }
  return ` (${formatRelative(start)} → ${formatRelative(current)})`;
}

function formatAverageLine(label: string, stats: ReviewAverages): string {
  return `${label} · ${stats.count}: ${formatKcalPlain(stats.fact.kcal)}/${formatKcalPlain(stats.target.kcal)} ккал, белок ${formatG(stats.fact.protein)}/${formatG(stats.target.protein)} г.`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function halfWindow(days: DayHistoryRow[]): {
  first: ReviewAverages;
  second: ReviewAverages;
} | null {
  if (days.length < 8) {
    return null;
  }

  const sorted = [...days].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const midIndex = Math.floor(sorted.length / 2);
  const first = averageMacros(sorted.slice(0, midIndex));
  const second = averageMacros(sorted.slice(midIndex));
  if (!first || !second || first.count < 3 || second.count < 3) {
    return null;
  }

  return {
    first: {
      count: first.count,
      fact: roundMacros(first.fact),
      target: roundMacros(first.target),
    },
    second: {
      count: second.count,
      fact: roundMacros(second.fact),
      target: roundMacros(second.target),
    },
  };
}

function worstProteinDays(
  days: DayHistoryRow[],
): Array<{ date: string; miss: number; training: boolean }> {
  return [...days]
    .flatMap((item) => {
      if (item.target_protein <= 0) {
        return [];
      }
      const miss = item.target_protein - item.fact_protein;
      if (miss < PROTEIN_MISS_G) {
        return [];
      }
      return [
        {
          date: item.date,
          miss,
          training: item.is_training_day,
        },
      ];
    })
    .sort((left, right) => right.miss - left.miss)
    .slice(0, 3);
}
