import type { MuscleId, VolumeBand } from "@/lib/types";
import { resolveExerciseMuscleWeights } from "@/lib/workout/muscle-resolve";
import { MUSCLE_LABELS, MUSCLE_VIEW } from "@/lib/workout/muscle-taxonomy";
import { volumeBandFromWeeklySets } from "@/lib/workout/muscle-volume";
import {
  type ProgramPresetId,
  programPresetById,
} from "@/lib/workout/program-presets";
import { starterSourceExerciseId } from "@/lib/workout/starter-catalog-map";

const DEFAULT_WORK_SETS = 3;

export type ProgramMusclePreviewRow = {
  id: MuscleId;
  label: string;
  sets_per_week: number;
  volume_band: VolumeBand;
};

export function programMusclePreview(
  presetId: ProgramPresetId,
): ProgramMusclePreviewRow[] {
  const preset = programPresetById(presetId);
  if (!preset) {
    return [];
  }
  const trainingDays = preset.templates;
  if (trainingDays.length === 0) {
    return [];
  }
  const loads = new Map<MuscleId, number>();

  for (const day of trainingDays) {
    for (const slot of day.exercises) {
      const sourceId = starterSourceExerciseId(slot.name);
      const weights = resolveExerciseMuscleWeights({
        exercise_id: "program-preview",
        name: slot.name,
        source_exercise_id: sourceId,
        body_part: null,
        name_en: null,
        name_ru: slot.name,
        equipment: null,
        target: null,
        secondary_muscles: [],
      });
      const workSets =
        slot.plan?.groups?.reduce(
          (sum: number, group: { sets: number }) => sum + group.sets,
          0,
        ) ?? DEFAULT_WORK_SETS;
      const credited = workSets > 0 ? workSets : DEFAULT_WORK_SETS;
      for (const [muscleId, weight] of Object.entries(weights)) {
        const id = muscleId as MuscleId;
        const prev = loads.get(id) ?? 0;
        loads.set(id, prev + credited * (weight ?? 0));
      }
    }
  }

  const perWeek = (total: number) => Math.round(total * 10) / 10;

  const rows: ProgramMusclePreviewRow[] = [];
  for (const [id, sets] of loads) {
    const setsPerWeek = perWeek(sets);
    if (setsPerWeek < 0.25) {
      continue;
    }
    rows.push({
      id,
      label: MUSCLE_LABELS[id],
      sets_per_week: setsPerWeek,
      volume_band: volumeBandFromWeeklySets(setsPerWeek, id),
    });
  }

  return rows.sort((left, right) => right.sets_per_week - left.sets_per_week);
}

export function programMusclePreviewCells(
  rows: ProgramMusclePreviewRow[],
): import("@/lib/types").MuscleCell[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    view: MUSCLE_VIEW[row.id],
    sets: row.sets_per_week,
    sets_per_week: row.sets_per_week,
    volume_band: row.volume_band,
    last_trained: null,
    days_since: null,
    in_next_session: false,
    missed_sessions: 0,
    weekly_sets: [row.sets_per_week],
    recovery_percent: null,
  }));
}
