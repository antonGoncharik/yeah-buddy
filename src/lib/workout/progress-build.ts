import type {
  ExerciseProgress,
  ExerciseWithMax,
  PhaseType,
  ProgressPoint,
  StrengthProgress,
} from "@/lib/types";
import { phaseLabel } from "@/lib/workout/labels";
import { percentChange } from "@/lib/workout/numbers";
import {
  relativeSeries,
  withRelativePoints,
} from "@/lib/workout/progress-stats";

export function buildExerciseProgress({
  exercises,
  phases,
  latestByPhase,
  globalPoints,
  workByExercise,
  weights,
  macroNumber,
}: {
  exercises: ExerciseWithMax[];
  phases: Array<{
    id: string;
    start_date: string;
    phase_type: PhaseType;
    name: string | null;
    macro_cycle_id: string;
  }>;
  latestByPhase: Map<string, number>;
  globalPoints: Map<string, ProgressPoint[]>;
  workByExercise: Map<string, ProgressPoint[]>;
  weights: Array<{ date: string; weight: number }>;
  macroNumber: Map<string, number>;
}): ExerciseProgress[] {
  const progress: ExerciseProgress[] = exercises.map((exercise) => {
    const workPoints = workByExercise.get(exercise.id) ?? [];
    const phasePoints: ProgressPoint[] = [];
    for (const phase of phases) {
      const weight = latestByPhase.get(`${phase.id}:${exercise.id}`);
      if (weight == null) {
        continue;
      }
      const number = macroNumber.get(phase.macro_cycle_id) ?? null;
      phasePoints.push({
        date: phase.start_date,
        weight,
        seconds: null,
        tonnage: null,
        circle_tonnage: null,
        body_weight: null,
        relative: null,
        phase_type: phase.phase_type,
        macro_number: number,
        label:
          number == null
            ? phaseLabel(phase.phase_type, phase.name)
            : `№${number} · ${phaseLabel(phase.phase_type, phase.name)}`,
      });
    }

    const fallback =
      phasePoints.length > 0
        ? phasePoints
        : (globalPoints.get(exercise.id) ?? []);
    const from_work = workPoints.length > 0;
    const points = withRelativePoints(
      from_work ? workPoints : fallback,
      weights,
    );
    const start_weight = points[0]?.weight ?? null;
    const current_weight = points.at(-1)?.weight ?? null;
    const delta =
      start_weight == null || current_weight == null
        ? null
        : current_weight - start_weight;
    const percent =
      start_weight == null || current_weight == null
        ? null
        : percentChange(start_weight, current_weight);
    const relatives = relativeSeries(points);
    const start_relative = relatives[0]?.relative ?? null;
    const current_relative = relatives.at(-1)?.relative ?? null;
    const relative_percent =
      start_relative == null || current_relative == null
        ? null
        : percentChange(start_relative, current_relative);
    const start_tonnage = points[0]?.tonnage ?? null;
    const current_tonnage = points.at(-1)?.tonnage ?? null;
    const tonnage_delta =
      start_tonnage == null || current_tonnage == null
        ? null
        : current_tonnage - start_tonnage;
    const tonnage_percent =
      start_tonnage == null || current_tonnage == null
        ? null
        : percentChange(start_tonnage, current_tonnage);

    return {
      exercise_id: exercise.id,
      name: exercise.short_name || exercise.name,
      category: exercise.category,
      current_weight,
      start_weight,
      delta,
      percent,
      current_relative,
      start_relative,
      relative_percent,
      current_tonnage,
      start_tonnage,
      tonnage_delta,
      tonnage_percent,
      points,
      from_work,
    };
  });

  progress.sort((left, right) => {
    const leftPercent = left.percent ?? -Infinity;
    const rightPercent = right.percent ?? -Infinity;
    if (rightPercent !== leftPercent) {
      return rightPercent - leftPercent;
    }
    return left.name.localeCompare(right.name, "ru");
  });

  return progress;
}

export function summarizeProgress(
  progress: ExerciseProgress[],
): Pick<
  StrengthProgress,
  "grown_count" | "avg_percent" | "avg_relative_percent"
> {
  const percents = progress.flatMap((item) =>
    item.percent == null ? [] : [item.percent],
  );
  const relativePercents = progress.flatMap((item) =>
    item.relative_percent == null ? [] : [item.relative_percent],
  );

  return {
    grown_count: progress.filter((item) => (item.delta ?? 0) > 0).length,
    avg_percent:
      percents.length === 0
        ? null
        : percents.reduce((sum, value) => sum + value, 0) / percents.length,
    avg_relative_percent:
      relativePercents.length === 0
        ? null
        : relativePercents.reduce((sum, value) => sum + value, 0) /
          relativePercents.length,
  };
}
