import type { MuscleCell, MuscleId, UserSex } from "@/lib/types";
import type { SessionExerciseDetail } from "@/lib/types/workout-session";
import { resolveExerciseMuscleWeights } from "@/lib/workout/muscle-resolve";
import { MUSCLE_LABELS, MUSCLE_VIEW } from "@/lib/workout/muscle-taxonomy";
import { volumeBandFromWeeklySets } from "@/lib/workout/muscle-volume";

function countWorkSets(sets: SessionExerciseDetail["sets"]): number {
  let count = 0;
  for (const set of sets) {
    if (set.set_type !== "work") {
      continue;
    }
    if (!set.is_completed) {
      continue;
    }
    const rir = set.actual_rir ?? set.planned_rir ?? null;
    count += rir != null && rir >= 3 ? 0.5 : 1;
  }
  return count;
}

export function sessionMuscleCells(
  exercises: SessionExerciseDetail[],
): MuscleCell[] {
  const loads = new Map<MuscleId, number>();

  for (const row of exercises) {
    const workSets = countWorkSets(row.sets);
    if (workSets <= 0) {
      continue;
    }
    const weights = resolveExerciseMuscleWeights({
      exercise_id: row.exercise_id,
      name: row.exercise.name,
      source_exercise_id: null,
      body_part: null,
      name_en: null,
      name_ru: row.exercise.name,
      equipment: null,
      target: null,
      secondary_muscles: [],
    });
    for (const [muscleId, weight] of Object.entries(weights)) {
      const id = muscleId as MuscleId;
      loads.set(id, (loads.get(id) ?? 0) + workSets * (weight ?? 0));
    }
  }

  const cells: MuscleCell[] = [];
  for (const [id, sets] of loads) {
    if (sets < 0.25) {
      continue;
    }
    const rounded = Math.round(sets * 10) / 10;
    cells.push({
      id,
      label: MUSCLE_LABELS[id],
      view: MUSCLE_VIEW[id],
      sets: rounded,
      sets_per_week: rounded,
      volume_band: volumeBandFromWeeklySets(rounded, id),
      last_trained: null,
      days_since: null,
      in_next_session: false,
      missed_sessions: 0,
      weekly_sets: [rounded],
      recovery_percent: null,
    });
  }
  return cells.sort((left, right) => right.sets - left.sets);
}

export function sessionMuscleFigureSex(
  sex: UserSex | null | undefined,
): UserSex | null {
  return sex === "male" || sex === "female" ? sex : null;
}
