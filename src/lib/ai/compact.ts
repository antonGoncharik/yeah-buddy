import { round0, round1 } from "@/lib/ai/format";
import type {
  ReviewAverages,
  ReviewDayRow,
  ReviewMaxRow,
  ReviewSessionRow,
  ReviewWeight,
} from "@/lib/ai/types";
import { bodyWeightWindow } from "@/lib/day/body-weight";
import type { Macros } from "@/lib/nutrition";
import type { averageMacros } from "@/lib/nutrition-stats";
import type {
  DayHistoryRow,
  ExerciseProgress,
  RecentWorkoutSession,
  StrengthProgress,
} from "@/lib/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

const WEAK_PLAN_RATIO = 0.75;
const WEAK_PLAN_MIN_SETS = 3;

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

export function compactWeight(
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

export function roundAverages(
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

export function roundMacros(macros: Macros): Macros {
  return {
    protein: round1(macros.protein),
    fat: round1(macros.fat),
    carbs: round1(macros.carbs),
    kcal: round0(macros.kcal),
  };
}

export function compactSessions(
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
        feel: item.session.feel,
      },
    ];
  });
}

export function sessionNotes(
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

export function compactFeels(sessions: ReviewSessionRow[]): {
  easy: number;
  close: number;
  miss: number;
} {
  const feels = { easy: 0, close: 0, miss: 0 };
  for (const item of sessions) {
    if (item.status !== "completed" || item.feel == null) {
      continue;
    }
    feels[item.feel] += 1;
  }
  return feels;
}

export function weakTemplates(items: RecentWorkoutSession[]): string[] {
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

export function compactMaxes(progress: StrengthProgress): {
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
