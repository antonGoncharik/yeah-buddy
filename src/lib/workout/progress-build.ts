import type {
  ExerciseProgress,
  ExerciseWithMax,
  PhaseType,
  ProgressPoint,
  StrengthProgress,
} from "@/lib/types";
import { phaseLabel } from "@/lib/workout/labels";
import { measureProgress, strengthGrown } from "@/lib/workout/progress-measure";
import {
  primaryProgressPoints,
  withRelativePoints,
} from "@/lib/workout/progress-stats";

export { measureProgress } from "@/lib/workout/progress-measure";

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
        e1rm: null,
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
    const allPoints = withRelativePoints(
      from_work ? workPoints : fallback,
      weights,
    );
    const points = primaryProgressPoints(allPoints);
    const measured = measureProgress(points);

    return {
      exercise_id: exercise.id,
      name: exercise.short_name || exercise.name,
      category: exercise.category,
      ...measured,
      points: allPoints,
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
    grown_count: progress.filter((item) => strengthGrown(item)).length,
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
